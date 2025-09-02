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
 * Validates if a response is a valid CallToolResult
 */
function isValidCallToolResult(response: unknown): response is CallToolResult {
  if (!response || typeof response !== "object") {
    return false;
  }

  const result = response as any;

  // Must have a content property that is an array
  if (!Array.isArray(result.content)) {
    return false;
  }

  // Each content item must be a valid content object
  for (const item of result.content) {
    if (!item || typeof item !== "object") {
      return false;
    }

    // Must have a type property
    if (typeof item.type !== "string") {
      return false;
    }

    // Validate based on content type
    if (item.type === "text") {
      if (typeof item.text !== "string") {
        return false;
      }
    } else if (item.type === "image") {
      if (typeof item.data !== "string" || typeof item.mimeType !== "string") {
        return false;
      }
    }
    // Allow other content types to pass through (future extensibility)
  }

  return true;
}

/**
 * Transforms a user's tool handler into an MCP-compatible handler.
 *
 * This function:
 * 1. Passes through both args and extra parameters to the user's handler
 * 2. Transforms string/number responses into the required CallToolResult format
 * 3. Validates that the response is a proper CallToolResult and throws a descriptive error if not
 *
 * @param handler - The user's tool handler function
 * @returns A transformed handler compatible with McpServer.registerTool
 * @throws Error if the handler returns an invalid response type
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

    if (!isValidCallToolResult(response)) {
      const responseType = response === null ? "null" : typeof response;
      const responseValue =
        response === undefined
          ? "undefined"
          : response === null
            ? "null"
            : typeof response === "object"
              ? JSON.stringify(response, null, 2)
              : String(response);

      throw new Error(
        `Tool handler must return a CallToolResult, string, or number. ` +
          `Got ${responseType}: ${responseValue}\n\n` +
          `Expected CallToolResult format:\n` +
          `{\n` +
          `  content: [\n` +
          `    { type: "text", text: "your text here" },\n` +
          `    // or { type: "image", data: "base64data", mimeType: "image/jpeg" }\n` +
          `  ]\n` +
          `}`
      );
    }

    return response;
  };
}
