import {
  specTypeSchemas,
  type GetPromptResult,
  type PromptMessage,
  type ServerContext,
} from "@modelcontextprotocol/server";
import { PromptArgsRawShape } from "../prompts";
import { validateContent } from "../validators";

/**
 * Type for content that users can return from prompt handlers
 */
export type PromptContent = GetPromptResult["messages"][number]["content"];

type UserPromptResult =
  | PromptContent
  | string
  | number
  | GetPromptResult
  | PromptMessage[];

/**
 * Type for the original prompt handler that users write
 * The extra parameter is optional for backward compatibility
 * Supports single content values, message arrays, and full prompt results.
 */
export type UserPromptHandler = (
  args: PromptArgsRawShape,
  extra?: ServerContext
) => UserPromptResult | Promise<UserPromptResult>;

/**
 * Type for the transformed handler that the MCP server expects
 */
export type McpPromptHandler = (
  args: PromptArgsRawShape,
  extra: ServerContext
) => GetPromptResult | Promise<GetPromptResult>;

/**
 * Transforms a user's prompt handler into an MCP-compatible handler.
 *
 * This function:
 * 1. Passes through both args and extra parameters to the user's handler
 * 2. Transforms string/number/content responses into a single message GetPromptResult format
 * 3. Preserves explicit message roles and full result metadata
 * 4. Validates that the response is valid and throws a descriptive error if not
 *
 * @param handler - The user's prompt handler function
 * @param role - The role for single content values ("user" or "assistant")
 * @returns A transformed handler compatible with McpServer.registerPrompt
 * @throws Error if the handler returns an invalid response type
 */
export function transformPromptHandler(
  handler: UserPromptHandler,
  role: "user" | "assistant" = "assistant"
): McpPromptHandler {
  return async (
    args: PromptArgsRawShape,
    extra: ServerContext
  ): Promise<GetPromptResult> => {
    let response = handler(args, extra);

    // only await if it's actually a promise
    if (response instanceof Promise) {
      response = await response;
    }

    if (
      Array.isArray(response) ||
      (response !== null &&
        typeof response === "object" &&
        "messages" in response)
    ) {
      const result = Array.isArray(response)
        ? { messages: response }
        : response;
      const validation =
        await specTypeSchemas.GetPromptResult["~standard"].validate(result);
      if (validation.issues) {
        const errors = validation.issues.map((issue) => {
          const path = issue.path
            ?.map((part) => (typeof part === "object" ? part.key : part))
            .join(".");
          return `${path || "result"}: ${issue.message}`;
        });
        throw new Error(`Invalid prompt result: ${errors.join("; ")}`);
      }
      // Validate without replacing the result: schema parsing can strip extensions.
      return result as GetPromptResult;
    }

    let content: GetPromptResult["messages"][number]["content"];

    // transform string/number responses to text content
    if (typeof response === "string" || typeof response === "number") {
      content = {
        type: "text",
        text: typeof response === "number" ? `${response}` : response,
      };
    } else {
      // validate content object responses
      const validationResult = validateContent(response);
      if (validationResult.valid) {
        content = response as PromptContent;
      } else {
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
          `Prompt handler must return a PromptContent object, string, number, PromptMessage[], or GetPromptResult. ` +
            `Got ${responseType}: ${responseValue}\n\n` +
            `Validation error: ${validationResult.error}\n\n` +
            `Expected formats:\n` +
            `- String: "your text here"\n` +
            `- Number: 42\n` +
            `- Messages: [{ role: "user", content: { type: "text", text: "your text here" } }]\n` +
            `- Prompt result: { description: "optional description", messages: [...] }\n` +
            `- Text content: { type: "text", text: "your text here" }\n` +
            `- Image content: { type: "image", data: "base64data", mimeType: "image/jpeg" }\n` +
            `- Audio content: { type: "audio", data: "base64data", mimeType: "audio/mpeg" }\n` +
            `- Resource link: { type: "resource_link", name: "resource name", uri: "resource://uri" }\n` +
            `- All content types support an optional "_meta" object property`
        );
      }
    }

    // validate the role
    if (role !== "user" && role !== "assistant") {
      throw new Error(`Invalid role: ${role}`);
    }

    // final result with single message
    const result = {
      messages: [
        {
          role,
          content,
        },
      ],
    };

    return result;
  };
}
