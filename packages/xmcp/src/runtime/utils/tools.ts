import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { ZodRawShape } from "zod";
import { ToolFile } from "./server";
import { ToolMetadata } from "@/types/tool";
import { transformToolHandler } from "./transformers/tool";

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

    // Transform the user's handler into an MCP-compatible handler
    // Use explicit type annotation to prevent infinite type recursion
    const transformedHandler = transformToolHandler(handler);

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
