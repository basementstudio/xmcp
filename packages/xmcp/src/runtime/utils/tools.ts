import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";
import { ZodRawShape } from "zod/v3";
import { ToolFile } from "./server";
import { ToolMetadata } from "@/types/tool";
import { transformToolHandler } from "./transformers/tool";
import { isReactFile } from "./react";
import { uIResourceRegistry } from "./ext-apps-registry";
import { flattenMeta, hasUIMeta } from "./ui/flatten-meta";
import { splitUIMetaNested } from "./ui/split-meta";
import { isPaidHandler, getX402Registry } from "xmcp/plugins/x402";
import {
  logExecutionEnd,
  logExecutionStart,
  summarizeToolOutput,
} from "./observability";

/** Validates if a value is a valid Zod schema object */
export function isZodRawShape(value: unknown): value is ZodRawShape {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;
  return Object.entries(obj).every(([key, val]) => {
    if (typeof key !== "string") return false;
    if (typeof val !== "object" || val === null) return false;
    if (!("parse" in val) || typeof val.parse !== "function") return false;
    return true;
  });
}

export function pathToName(path: string): string {
  const fileName = path.split("/").pop() || path;
  return fileName.replace(/\.[^/.]+$/, "");
}

/** Loads tools and injects them into the server */
export function addToolsToServer(
  server: McpServer,
  toolModules: Map<string, ToolFile>
): McpServer {
  toolModules.forEach((toolModule, path) => {
    const defaultName = pathToName(path);

    const toolConfig: ToolMetadata = {
      name: defaultName,
      description: "No description provided",
    };

    const { default: handler, metadata, schema } = toolModule;

    if (typeof metadata === "object" && metadata !== null) {
      Object.assign(toolConfig, metadata);
    }

    // Register paid tools in x402 registry if plugin is installed
    if (isPaidHandler(handler)) {
      const registry = getX402Registry();
      if (registry) {
        registry.set(toolConfig.name, handler.__x402);
      }
    }

    // Determine the actual schema to use
    let toolSchema: ZodRawShape = {};
    if (isZodRawShape(schema)) {
      toolSchema = schema;
    } else if (schema !== undefined && schema !== null) {
      console.warn(
        `Invalid schema for tool "${toolConfig.name}" at ${path}. Expected Record<string, z.ZodType>`
      );
    }

    // Make sure tools has annotations with a title
    if (toolConfig.annotations === undefined) {
      toolConfig.annotations = {};
    }
    if (toolConfig.annotations.title === undefined) {
      toolConfig.annotations.title = toolConfig.name;
    }

    if (toolConfig._meta === undefined) {
      toolConfig._meta = {};
    }

    const isReact = isReactFile(path);

    const uiWidget = hasUIMeta(toolConfig._meta) || isReact;

    let toolSpecificMeta = toolConfig._meta;

    if (uiWidget) {
      const mcpuiResourceUri = `ui://app/${toolConfig.name}.html`;

      if (!toolConfig._meta.ui) {
        toolConfig._meta.ui = {};
      }
      if (!toolConfig._meta.ui.resourceUri) {
        toolConfig._meta.ui.resourceUri = mcpuiResourceUri;
      }

      const uiSplit = splitUIMetaNested(toolSpecificMeta);
      toolSpecificMeta = uiSplit.toolMeta;
      const resourceSpecificMeta = uiSplit.resourceMeta;

      // Ensure CSP resource domains includes esm.sh
      resourceSpecificMeta.ui = resourceSpecificMeta.ui || {};
      resourceSpecificMeta.ui.csp = resourceSpecificMeta.ui.csp || {};
      resourceSpecificMeta.ui.csp.resourceDomains =
        resourceSpecificMeta.ui.csp.resourceDomains || [];

      if (
        !resourceSpecificMeta.ui.csp.resourceDomains.includes(
          "https://esm.sh"
        )
      ) {
        resourceSpecificMeta.ui.csp.resourceDomains.push("https://esm.sh");
      }

      uIResourceRegistry.add(toolConfig.name, {
        name: toolConfig.name,
        uri: mcpuiResourceUri,
        handler,
        mimeType: "text/html;profile=mcp-app",
        _meta: resourceSpecificMeta,
        toolPath: isReact ? path : undefined,
      });
    }

    const flattenedToolMeta = flattenMeta(toolSpecificMeta);
    const meta = uiWidget ? flattenedToolMeta : undefined;
    let transformedHandler;

    if (isReactFile(path) && uiWidget) {
      transformedHandler = async (args: any, extra: any) => {
        const startedAt = logExecutionStart({
          type: "tool",
          name: toolConfig.name,
          input: args,
          extra,
        });

        try {
          const result = {
            content: [{ type: "text", text: "" }],
            _meta: meta,
            structuredContent: {
              args,
            },
          };

          logExecutionEnd({
            type: "tool",
            name: toolConfig.name,
            startedAt,
            extra,
            outputSummary: summarizeToolOutput(result as any),
          });
          return result;
        } catch (error) {
          logExecutionEnd({
            type: "tool",
            name: toolConfig.name,
            startedAt,
            extra,
            error,
          });
          throw error;
        }
      };
    } else {
      transformedHandler = transformToolHandler(handler, meta, toolConfig.name);
    }

    const toolConfigFormatted = {
      title: toolConfig.annotations?.title,
      description: toolConfig.description,
      // Build the object schema using the project's Zod instance to avoid
      // cross-instance v3 shape issues in tools/list JSON schema generation.
      inputSchema: z.object(toolSchema),
      annotations: toolConfig.annotations,
      _meta: flattenedToolMeta, // Use flattened metadata for MCP protocol
    };

    // server as any prevents infinite type recursion
    (server as any).registerTool(
      toolConfig.name,
      toolConfigFormatted,
      transformedHandler
    );
  });

  return server;
}
