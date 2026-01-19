import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { ZodRawShape } from "zod/v3";
import { ToolFile } from "./server";
import { ToolMetadata } from "@/types/tool";
import { transformToolHandler } from "./transformers/tool";
import { openAIResourceRegistry } from "./openai-resource-registry";
import { flattenMeta } from "./openai/flatten-meta";
import { isReactFile } from "./react";
import { splitOpenAIMetaNested } from "./openai/split-meta";
import { uIResourceRegistry } from "./ext-apps-registry";
import { hasUIMeta } from "./ui/flatten-meta";
import { splitUIMetaNested } from "./ui/split-meta";
import { normalizeUnifiedUIMetadata } from "./ui/unified-meta";
import { isPaidHandler, getX402Registry } from "xmcp/plugins/x402";

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

    const hasLegacyOpenAI =
      toolConfig._meta.openai &&
      typeof toolConfig._meta.openai === "object" &&
      toolConfig._meta.openai !== null;

    const shouldRegisterUI =
      hasUIMeta(toolConfig._meta) || hasLegacyOpenAI || isReact;

    let toolSpecificMeta = toolConfig._meta;

    if (shouldRegisterUI) {
      const openaiResourceUri = `ui://widget/${toolConfig.name}.html`;
      const mcpuiResourceUri = `ui://app/${toolConfig.name}.html`;

      if (!toolConfig._meta.ui || typeof toolConfig._meta.ui !== "object") {
        toolConfig._meta.ui = {};
      }

      if (!toolConfig._meta.ui.outputTemplate) {
        toolConfig._meta.ui.outputTemplate = openaiResourceUri;
      }

      if (!toolConfig._meta.ui.resourceUri) {
        toolConfig._meta.ui.resourceUri = mcpuiResourceUri;
      }

      normalizeUnifiedUIMetadata(toolConfig._meta);

      const openaiSplit = splitOpenAIMetaNested(toolSpecificMeta);
      toolSpecificMeta = openaiSplit.toolMeta;

      openAIResourceRegistry.add(toolConfig.name, {
        name: toolConfig.name,
        uri: openaiResourceUri,
        handler,
        _meta:
          openaiSplit.resourceMeta &&
          Object.keys(openaiSplit.resourceMeta).length > 0
            ? openaiSplit.resourceMeta
            : undefined,
        toolPath: isReact ? path : undefined,
        mimeType: "text/html+skybridge",
      });

      const uiSplit = splitUIMetaNested(toolSpecificMeta);
      toolSpecificMeta = uiSplit.toolMeta;
      const resourceSpecificMeta = uiSplit.resourceMeta ?? {};

      // Ensure CSP resource domains includes esm.sh
      resourceSpecificMeta.ui = resourceSpecificMeta.ui || {};
      resourceSpecificMeta.ui.csp = resourceSpecificMeta.ui.csp || {};
      resourceSpecificMeta.ui.csp.resourceDomains =
        resourceSpecificMeta.ui.csp.resourceDomains || [];

      if (
        !resourceSpecificMeta.ui.csp.resourceDomains.includes("https://esm.sh")
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
    const meta = shouldRegisterUI ? flattenedToolMeta : undefined;
    let transformedHandler;

    if (isReactFile(path) && shouldRegisterUI) {
      transformedHandler = async (args: any, extra: any) => ({
        content: [{ type: "text", text: "" }],
        _meta: meta,
        structuredContent: {
          args,
        },
      });
    } else {
      transformedHandler = transformToolHandler(handler, meta);
    }

    const toolConfigFormatted = {
      title: toolConfig.annotations?.title,
      description: toolConfig.description,
      inputSchema: toolSchema,
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
