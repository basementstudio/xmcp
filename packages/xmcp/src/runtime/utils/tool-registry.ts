import { z } from "zod";
import { ZodRawShape } from "zod/v3";
import type { ToolInfo, CallToolResultCompat, ToolAnnotations } from "@/types/tool";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol";
import type { ServerRequest, ServerNotification } from "@modelcontextprotocol/sdk/types";
import { transformToolHandler } from "./transformers/tool";
import type { UserToolHandler } from "./transformers/tool";

// Use MCP SDK's built-in Zod-to-JSON-Schema conversion (handles both Zod v3 and v4)
import { toJsonSchemaCompat } from "@modelcontextprotocol/sdk/server/zod-json-schema-compat.js";

interface ToolRegistryEntry {
  name: string;
  description: string;
  handler: UserToolHandler;
  schema: ZodRawShape;
  outputSchema?: ZodRawShape;
  annotations?: ToolAnnotations;
}

export class ToolRegistry {
  private entries = new Map<string, ToolRegistryEntry>();
  private cachedInfos: ToolInfo[] | null = null;

  /**
   * Register a tool in the registry. Called during server initialization.
   */
  register(
    name: string,
    handler: UserToolHandler,
    schema: ZodRawShape,
    outputSchema: ZodRawShape | undefined,
    description: string,
    annotations?: ToolAnnotations
  ): void {
    this.entries.set(name, {
      name,
      description,
      handler,
      schema,
      outputSchema,
      annotations,
    });
    // Invalidate cache when a new tool is registered
    this.cachedInfos = null;
  }

  /**
   * Returns a cached, frozen array of ToolInfo for all registered tools.
   * Serializes Zod schemas to JSON Schema on first call.
   */
  list(): ToolInfo[] {
    if (this.cachedInfos !== null) {
      return this.cachedInfos;
    }

    const infos: ToolInfo[] = [];
    for (const entry of this.entries.values()) {
      let inputSchema: Record<string, unknown> = {};
      try {
        const zodObj = z.object(entry.schema);
        inputSchema = toJsonSchemaCompat(zodObj as any, {
          strictUnions: true,
        }) as Record<string, unknown>;
      } catch {
        // Fallback: return empty schema if conversion fails
        inputSchema = { type: "object", properties: {} };
      }

      let outputSchema: Record<string, unknown> | undefined;
      if (entry.outputSchema) {
        try {
          const zodObj = z.object(entry.outputSchema);
          outputSchema = toJsonSchemaCompat(zodObj as any, {
            strictUnions: true,
          }) as Record<string, unknown>;
        } catch {
          // Fallback: omit outputSchema if conversion fails
        }
      }

      infos.push({
        name: entry.name,
        description: entry.description,
        inputSchema,
        outputSchema,
        annotations: entry.annotations,
      });
    }

    this.cachedInfos = Object.freeze(infos) as ToolInfo[];
    return this.cachedInfos;
  }

  /**
   * Invoke a registered tool by name. Never throws — always returns a CallToolResult.
   * Validates args against the tool's Zod schema before invoking.
   */
  async call(
    toolName: string,
    args: Record<string, unknown>,
    extra: RequestHandlerExtra<ServerRequest, ServerNotification>
  ): Promise<CallToolResultCompat> {
    const entry = this.entries.get(toolName);

    if (!entry) {
      const available = Array.from(this.entries.keys()).join(", ");
      return {
        content: [
          {
            type: "text",
            text: `Tool "${toolName}" not found. Available tools: ${available}`,
          },
        ],
        isError: true,
      };
    }

    // Check abort signal before proceeding
    if (extra.signal?.aborted) {
      return {
        content: [
          {
            type: "text",
            text: `Tool "${toolName}" was aborted`,
          },
        ],
        isError: true,
      };
    }

    // Validate args against tool's schema
    const schemaObj = z.object(entry.schema);
    const parseResult = schemaObj.safeParse(args);
    if (!parseResult.success) {
      return {
        content: [
          {
            type: "text",
            text: `Validation error for tool "${toolName}": ${parseResult.error.message}`,
          },
        ],
        isError: true,
      };
    }

    try {
      // Wrap the user handler through transformToolHandler to get proper CallToolResult
      const mcpHandler = transformToolHandler(
        entry.handler,
        undefined,
        entry.outputSchema,
        entry.name
      );
      const result = await mcpHandler(parseResult.data as ZodRawShape, extra);
      return result as CallToolResultCompat;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Tool "${toolName}" failed: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }

  has(name: string): boolean {
    return this.entries.has(name);
  }
}
