import {
  CallToolResult,
  ServerRequest,
  ServerNotification,
} from "@modelcontextprotocol/sdk/types";
import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol";
import { ZodRawShape } from "zod";

/**
 * Type for the original tool handler that users write
 */
export type UserToolHandler = (
  args: ZodRawShape,
  extra: RequestHandlerExtra<ServerRequest, ServerNotification>
) =>
  | CallToolResult
  | string
  | number
  | Promise<CallToolResult | string | number>;

/**
 * Type for the transformed handler that the MCP server expects
 */
export type McpToolHandler = (
  args: ZodRawShape,
  extra: RequestHandlerExtra<ServerRequest, ServerNotification>
) => CallToolResult | Promise<CallToolResult>;

/**
 * Transforms a user's tool handler into an MCP-compatible handler.
 *
 * This function:
 * 1. Passes through both args and extra parameters to the user's handler
 * 2. Transforms string/number responses into the required CallToolResult format
 *
 * @param handler - The user's tool handler function
 * @returns A transformed handler compatible with McpServer.registerTool
 */
export function transformToolHandler(handler: UserToolHandler): McpToolHandler {
  return async (
    args: ZodRawShape,
    extra: RequestHandlerExtra<ServerRequest, ServerNotification>
  ): Promise<CallToolResult> => {
    let response = handler(args, extra);

    // only await if it's actually a promise
    if (response instanceof Promise) {
      response = await response;
    }

    // Transform string/number responses into CallToolResult format
    if (typeof response === "string" || typeof response === "number") {
      return {
        content: [
          {
            type: "text",
            text: typeof response === "number" ? `${response}` : response,
          },
        ],
      };
    }

    return response;
  };
}
