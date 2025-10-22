import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { ZodRawShape } from "zod";
import { ToolFile } from "./server";
import { ToolMetadata } from "@/types/tool";
import { transformToolHandler } from "./transformers/tool";
import { openAIResourceRegistry } from "./openai-resource-registry";
import { flattenMeta, hasOpenAIMeta } from "./openai/flatten-meta";
import { isReactFile } from "./ssr";
import { splitOpenAIMetaNested } from "./openai/split-meta";

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

    // Check if this is an OpenAI widget tool
    const isOpenAITool = hasOpenAIMeta(toolConfig._meta);

    // Split metadata into tool-specific and resource-specific
    let toolSpecificMeta = toolConfig._meta;
    let resourceSpecificMeta: Record<string, any> = {};

    if (isOpenAITool) {
      const split = splitOpenAIMetaNested(toolConfig._meta);
      toolSpecificMeta = split.toolMeta;
      resourceSpecificMeta = split.resourceMeta;

      // Auto-generate the resource URI
      const resourceUri = `ui://widget/${toolConfig.name}.html`;

      // Auto-inject the outputTemplate if not already present
      if (!toolSpecificMeta.openai) {
        toolSpecificMeta.openai = {};
      }
      if (!toolSpecificMeta.openai.outputTemplate) {
        toolSpecificMeta.openai.outputTemplate = resourceUri;
      }
      
      const isReact = isReactFile(path);

      // Add to the OpenAI resource registry for auto-generation
      openAIResourceRegistry.add(toolConfig.name, {
        name: toolConfig.name,
        uri: resourceUri,
        handler: handler, // Store the original handler
        toolMeta: toolSpecificMeta,
        resourceMeta: resourceSpecificMeta,
        isReactComponent: isReact,
        toolPath: isReact ? path : undefined,
      });
    }

    const flattenedToolMeta = flattenMeta(toolSpecificMeta);

    // Transform the user's handler into an MCP-compatible handler
    // Pass flattened metadata for OpenAI tools so the transformer can auto-wrap HTML responses
    const transformedHandler = transformToolHandler(
      handler,
      isOpenAITool ? flattenedToolMeta : undefined
    );

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
