import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { ZodRawShape } from "zod/v3";
import { ToolFile } from "./server";
import { ToolMetadata } from "@/types/tool";
import { transformToolHandler } from "./transformers/tool";
import { openAIResourceRegistry } from "./openai-resource-registry";
import { flattenMeta, hasOpenAIMeta } from "./openai/flatten-meta";
import { isReactFile } from "./react";
import { splitOpenAIMetaNested } from "./openai/split-meta";
import { uIResourceRegistry } from "./ext-apps-registry";
import { hasUIMeta } from "./ui/flatten-meta";
import { splitUIMetaNested } from "./ui/split-meta";

// TO DO: remove duplicated
interface X402ToolOptions {
  price?: number;
  currency?: string;
  network?: string;
  receipt?: boolean;
  maxPaymentAge?: number;
  description?: string;
}

interface PaidHandler {
  __x402: X402ToolOptions;
}

declare global {
  var __XMCP_X402_REGISTRY: Map<string, X402ToolOptions> | undefined;
}

/**
 * Check if a handler is wrapped with paid() from @xmcp-dev/x402 plugin
 */
function isPaidHandler(handler: unknown): handler is PaidHandler {
  return typeof handler === "function" && "__x402" in handler;
}

/**
 * Get the x402 registry if the plugin is installed
 */
function getX402Registry(): Map<string, X402ToolOptions> | undefined {
  return global.__XMCP_X402_REGISTRY;
}

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

    // Check if this is an OpenAI widget tool
    const openaiWidget = hasOpenAIMeta(toolConfig._meta);
    const uiWidget = hasUIMeta(toolConfig._meta) || (isReact && !openaiWidget);

    let toolSpecificMeta = toolConfig._meta;

    if (uiWidget || openaiWidget) {
      const openaiResourceUri = `ui://widget/${toolConfig.name}.html`;
      const mcpuiResourceUri = `ui://app/${toolConfig.name}.html`;

      // Auto-inject outputTemplate and resourceUri before splitting
      if (openaiWidget) {
        if (!toolConfig._meta.openai) {
          toolConfig._meta.openai = {};
        }
        if (!toolConfig._meta.openai.outputTemplate) {
          toolConfig._meta.openai.outputTemplate = openaiResourceUri;
        }
      }

      if (uiWidget) {
        if (!toolConfig._meta.ui) {
          toolConfig._meta.ui = {};
        }
        if (!toolConfig._meta.ui.resourceUri) {
          toolConfig._meta.ui.resourceUri = mcpuiResourceUri;
        }
      }

      // Split metadata only for the widgets that are enabled
      if (openaiWidget) {
        const openaiSplit = splitOpenAIMetaNested(toolSpecificMeta);
        toolSpecificMeta = openaiSplit.toolMeta;

        openAIResourceRegistry.add(toolConfig.name, {
          name: toolConfig.name,
          uri: openaiResourceUri,
          handler,
          _meta: openaiSplit.resourceMeta,
          toolPath: isReact ? path : undefined,
          mimeType: "text/html+skybridge",
        });
      }

      if (uiWidget) {
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
    }

    const flattenedToolMeta = flattenMeta(toolSpecificMeta);
    const meta = openaiWidget || uiWidget ? flattenedToolMeta : undefined;
    let transformedHandler;

    if (isReactFile(path) && (openaiWidget || uiWidget)) {
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
