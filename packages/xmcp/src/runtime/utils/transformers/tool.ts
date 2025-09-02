import {
  CallToolResult,
  ServerRequest,
  ServerNotification,
} from "@modelcontextprotocol/sdk/types";
import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol";
import { ZodRawShape } from "zod";
import { validateContent } from "../validators";

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

    // validate response
    if (
      !response ||
      typeof response !== "object" ||
      !Array.isArray(response.content)
    ) {
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
          `    { type: "image", data: "base64data", mimeType: "image/jpeg" },\n` +
          `    { type: "audio", data: "base64data", mimeType: "audio/mpeg" },\n` +
          `    { type: "resource_link", name: "resource name", uri: "resource://uri" }\n` +
          `    // All content types support an optional "_meta" object property\n` +
          `  ]\n` +
          `}`
      );
    }

    // validate each content item
    for (let i = 0; i < response.content.length; i++) {
      const contentItem = response.content[i];
      const validationResult = validateContent(contentItem);
      if (!validationResult.valid) {
        throw new Error(
          `Invalid content item at index ${i}: ${validationResult.error}\n\n` +
            `Content item: ${JSON.stringify(contentItem, null, 2)}\n\n` +
            `Expected content formats:\n` +
            `- Text: { type: "text", text: "your text here" }\n` +
            `- Image: { type: "image", data: "base64data", mimeType: "image/jpeg" }\n` +
            `- Audio: { type: "audio", data: "base64data", mimeType: "audio/mpeg" }\n` +
            `- Resource: { type: "resource_link", name: "name", uri: "uri" }\n` +
            `All content types support an optional "_meta" object property`
        );
      }
    }

    return response;
  };
}
