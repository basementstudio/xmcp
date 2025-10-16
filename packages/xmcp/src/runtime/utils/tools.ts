import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { ZodRawShape } from "zod";
import { ToolFile } from "./server";
import { ToolMetadata } from "@/types/tool";
import { transformToolHandler } from "./transformers/tool";
import { openAIResourceRegistry } from "./openai-resource-registry";

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

    // Determine the actual schema to use
    let toolSchema: ZodRawShape = {};
    if (isZodRawShape(schema)) {
      toolSchema = schema;
    } else if (schema !== undefined && schema !== null) {
      console.warn(
        `Invalid schema for tool "${toolConfig.name}" at ${path}. Expected Record<string, z.ZodType>`
      );
    }

    // Check if this is an OpenAI widget tool (before transforming)
    const hasOpenAIMeta =
      toolConfig._meta &&
      typeof toolConfig._meta === "object" &&
      Object.keys(toolConfig._meta).some((key) => key.startsWith("openai/"));

    // Transform the user's handler into an MCP-compatible handler
    // Pass metadata for OpenAI tools so the transformer can auto-wrap HTML responses
    const transformedHandler = transformToolHandler(
      handler,
      hasOpenAIMeta ? toolConfig._meta : undefined
    );

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

    // Add to resources registry if this is an OpenAI widget tool
    if (hasOpenAIMeta) {
      // Auto-generate the resource URI
      const resourceUri = `ui://widget/${toolConfig.name}.html`;

      // Auto-inject the outputTemplate if not already present
      if (!toolConfig._meta["openai/outputTemplate"]) {
        toolConfig._meta["openai/outputTemplate"] = resourceUri;
      }

      // Add to the OpenAI resource registry for auto-generation
      openAIResourceRegistry.add(toolConfig.name, {
        name: toolConfig.name,
        uri: resourceUri,
        handler: handler, // Store the original handler
        toolMeta: toolConfig._meta,
      });
    }

    const toolConfigFormatted = {
      title: toolConfig.annotations?.title,
      description: toolConfig.description,
      inputSchema: toolSchema,
      annotations: toolConfig.annotations,
      _meta: toolConfig._meta,
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
