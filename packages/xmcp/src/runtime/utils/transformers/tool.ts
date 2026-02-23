import {
  CallToolResult,
  ServerRequest,
  ServerNotification,
} from "@modelcontextprotocol/sdk/types";
import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol";
import { ZodRawShape } from "zod/v3";
import { validateContent } from "../validators";

function validateAgainstOutputSchema(
  data: Record<string, unknown>,
  outputSchema: ZodRawShape,
  toolName: string,
  errorPrefix: string
): void {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(
      `Tool "${toolName}" ${errorPrefix}: expected a plain object.`
    );
  }

  const outputKeys = new Set(Object.keys(outputSchema));
  const extraKeys = Object.keys(data).filter((key) => !outputKeys.has(key));
  if (extraKeys.length > 0) {
    throw new Error(
      `Tool "${toolName}" ${errorPrefix}: unrecognized key(s): ${extraKeys.join(", ")}`
    );
  }

  for (const [fieldName, fieldSchema] of Object.entries(outputSchema)) {
    try {
      fieldSchema.parse((data as any)[fieldName]);
    } catch (error: any) {
      throw new Error(
        `Tool "${toolName}" ${errorPrefix}: ${error?.message ?? `invalid field "${fieldName}"`}`
      );
    }
  }
}

/**
 * Type for the original tool handler that users write
 */
export type UserToolResponse =
  | CallToolResult
  | string
  | number
  | Record<string, unknown>;

export type UserToolHandler = (
  args: ZodRawShape,
  extra: RequestHandlerExtra<ServerRequest, ServerNotification>
) =>
  | UserToolResponse
  | Promise<UserToolResponse>;

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
  meta?: Record<string, any>,
  outputSchema?: ZodRawShape,
  toolName = "unknown-tool"
): McpToolHandler {
  return async (
    args: ZodRawShape,
    extra: RequestHandlerExtra<ServerRequest, ServerNotification>
  ): Promise<CallToolResult> => {
    let response: any = handler(args, extra);

    // only await if it's actually a promise
    if (response instanceof Promise) {
      response = await response;
    }

    if (typeof response === "string" || typeof response === "number") {
      if (outputSchema) {
        const outputSchemaEntries = Object.entries(outputSchema);
        if (outputSchemaEntries.length !== 1) {
          throw new Error(
            `Tool "${toolName}" returned a primitive output, but outputSchema auto-mapping requires exactly one field. ` +
              `Found ${outputSchemaEntries.length} fields. Return an explicit { structuredContent: ... } object instead.`
          );
        }

        const [fieldName, fieldSchema] = outputSchemaEntries[0];
        try {
          fieldSchema.parse(response);
        } catch {
          throw new Error(
            `Tool "${toolName}" returned a primitive ${typeof response}, but outputSchema field "${fieldName}" does not accept this value. ` +
              `Return an explicit { structuredContent: ... } object instead.`
          );
        }

        return {
          content: [
            {
              type: "text",
              text: typeof response === "number" ? `${response}` : response,
            },
          ],
          structuredContent: {
            [fieldName]: response,
          },
        };
      }

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
          structuredContent: {
            args,
          },
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

    // With outputSchema declared, allow returning a plain object as shorthand
    // for `{ structuredContent: ... }`.
    if (
      outputSchema &&
      response &&
      typeof response === "object" &&
      !Array.isArray(response) &&
      !("structuredContent" in response) &&
      !("content" in response && Array.isArray((response as any).content))
    ) {
      // Validate the response against outputSchema before wrapping.
      validateAgainstOutputSchema(
        response as Record<string, unknown>,
        outputSchema,
        toolName,
        "returned data that does not match outputSchema"
      );
      response = {
        structuredContent: response,
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
    let hasContent = "content" in response && Array.isArray(response.content);
    const hasStructuredContent = "structuredContent" in response;
    const isError = "isError" in response && (response as any).isError === true;

    if (outputSchema && !hasStructuredContent && !isError) {
      throw new Error(
        `Tool "${toolName}" declares outputSchema and must return "structuredContent".`
      );
    }

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

    // Validate structuredContent against outputSchema if present.
    if (outputSchema && hasStructuredContent) {
      validateAgainstOutputSchema(
        (response as any).structuredContent as Record<string, unknown>,
        outputSchema,
        toolName,
        "returned structuredContent that does not match outputSchema"
      );
    }

    // Auto-generate text fallback for clients that only render content.
    if (!hasContent && hasStructuredContent) {
      response.content = [
        {
          type: "text",
          text: JSON.stringify((response as any).structuredContent),
        },
      ];
      hasContent = true;
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

    return response as CallToolResult;
  };
}
