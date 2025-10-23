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
 * 3. Allows returning `content`, `structuredContent`, or both
 * 4. Allows returning only `_meta` (without `content`) when it contains OpenAI-specific keys
 * 5. Auto-wraps HTML strings with OpenAI metadata if provided
 * 6. Validates that the response is a proper CallToolResult and throws a descriptive error if not
 *
 * @param handler - The user's tool handler function
 * @param meta - Optional metadata to attach to responses (for OpenAI widgets)
 * @returns A transformed handler compatible with McpServer.registerTool
 * @throws Error if the handler returns an invalid response type
 */
export function transformToolHandler(
  handler: UserToolHandler,
  meta?: Record<string, any>
): McpToolHandler {
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
      // Check if we have OpenAI metadata to attach
      const hasOpenAIMeta =
        meta &&
        typeof meta === "object" &&
        Object.keys(meta).some((key) => key.startsWith("openai/"));

      if (hasOpenAIMeta) {
        // For OpenAI widgets, return empty text content with metadata
        // The actual HTML is served by the auto-generated resource
        return {
          content: [
            {
              type: "text",
              text: "",
            },
          ],
          _meta: meta,
        };
      }

      // Regular string/number response
      return {
        content: [
          {
            type: "text",
            text: typeof response === "number" ? `${response}` : response,
          },
        ],
      };
    }

    // Check if response has _meta but no content (special case for OpenAI metadata)
    if (
      response &&
      typeof response === "object" &&
      "_meta" in response &&
      !("content" in response) &&
      !("structuredContent" in response)
    ) {
      const meta = (response as any)._meta;

      // Check if _meta contains OpenAI-specific keys (keys starting with "openai/")
      if (
        meta &&
        typeof meta === "object" &&
        Object.keys(meta).some((key) => key.startsWith("openai/"))
      ) {
        // Transform to include empty text content with the _meta
        return {
          content: [
            {
              type: "text",
              text: "",
            },
          ],
          _meta: meta,
        };
      }
    }

    // validate response is an object
    if (!response || typeof response !== "object") {
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
          `}\n\n` +
          `Or with structured content:\n` +
          `{\n` +
          `  structuredContent: { your: "data" }\n` +
          `}\n\n` +
          `Or both for backwards compatibility:\n` +
          `{\n` +
          `  content: [{ type: "text", text: "fallback" }],\n` +
          `  structuredContent: { your: "data" }\n` +
          `}\n\n` +
          `Or for OpenAI metadata only:\n` +
          `{\n` +
          `  _meta: {\n` +
          `    "openai/...": ...\n` +
          `  }\n` +
          `}`
      );
    }

    // Check if response has at least one of: content, structuredContent, or valid OpenAI _meta
    const hasContent = "content" in response && Array.isArray(response.content);
    const hasStructuredContent = "structuredContent" in response;

    if (!hasContent && !hasStructuredContent) {
      const responseValue = JSON.stringify(response, null, 2);

      throw new Error(
        `Tool handler must return at least 'content' or 'structuredContent'. ` +
          `Got: ${responseValue}\n\n` +
          `Expected CallToolResult format:\n` +
          `{\n` +
          `  content: [\n` +
          `    { type: "text", text: "your text here" },\n` +
          `    { type: "image", data: "base64data", mimeType: "image/jpeg" },\n` +
          `    { type: "audio", data: "base64data", mimeType: "audio/mpeg" },\n` +
          `    { type: "resource_link", name: "resource name", uri: "resource://uri" }\n` +
          `  ]\n` +
          `}\n\n` +
          `Or with structured content:\n` +
          `{\n` +
          `  structuredContent: { your: "data" }\n` +
          `}\n\n` +
          `Or both for backwards compatibility:\n` +
          `{\n` +
          `  content: [{ type: "text", text: "fallback" }],\n` +
          `  structuredContent: { your: "data" }\n` +
          `}`
      );
    }

    // validate each content item if content is present
    if (hasContent) {
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
    }

    // validate structuredContent if present
    if (hasStructuredContent) {
      const structuredContent = (response as any).structuredContent;

      if (
        structuredContent === null ||
        typeof structuredContent !== "object" ||
        Array.isArray(structuredContent)
      ) {
        const structuredType = Array.isArray(structuredContent)
          ? "array"
          : typeof structuredContent;

        throw new Error(
          `'structuredContent' must be a plain object (not an array or primitive). ` +
            `Got ${structuredType}: ${JSON.stringify(structuredContent, null, 2)}\n\n` +
            `Expected format:\n` +
            `{\n` +
            `  structuredContent: {\n` +
            `    key: "value",\n` +
            `    nested: { data: "here" }\n` +
            `  }\n` +
            `}`
        );
      }
    }

    return response;
  };
}
