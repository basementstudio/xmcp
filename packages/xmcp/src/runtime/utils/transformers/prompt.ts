import {
  GetPromptResult,
  ServerRequest,
  ServerNotification,
} from "@modelcontextprotocol/sdk/types";
import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol";
import { PromptArgsRawShape } from "../prompts";
import { contentValidators, validateContent } from "../validators";
import {
  logExecutionEnd,
  logExecutionStart,
  summarizePromptOutput,
} from "../observability";

/**
 * Type for content that users can return from prompt handlers
 */
export type PromptContent = GetPromptResult["messages"][number]["content"];
// could be exporting this for typing the prompt handler and make sure return type is type safe

/**
 * Type for the original prompt handler that users write
 * The extra parameter is optional for backward compatibility
 * Users can only return content objects, strings, or numbers - not full message arrays
 */
export type UserPromptHandler = (
  args: PromptArgsRawShape,
  extra?: RequestHandlerExtra<ServerRequest, ServerNotification>
) => PromptContent | string | number | Promise<PromptContent | string | number>;

/**
 * Type for the transformed handler that the MCP server expects
 */
export type McpPromptHandler = (
  args: PromptArgsRawShape,
  extra: RequestHandlerExtra<ServerRequest, ServerNotification>
) => GetPromptResult | Promise<GetPromptResult>;

/**
 * Transforms a user's prompt handler into an MCP-compatible handler.
 *
 * This function:
 * 1. Passes through both args and extra parameters to the user's handler
 * 2. Transforms string/number/content responses into a single message GetPromptResult format
 * 3. Always creates exactly one message with the specified role
 * 4. Validates that the response is valid and throws a descriptive error if not
 *
 * @param handler - The user's prompt handler function
 * @param role - The role to assign to the message ("user" or "assistant")
 * @returns A transformed handler compatible with McpServer.registerPrompt
 * @throws Error if the handler returns an invalid response type
 */
export function transformPromptHandler(
  handler: UserPromptHandler,
  role: "user" | "assistant" = "assistant",
  promptName: string = "unknown-prompt"
): McpPromptHandler {
  return async (
    args: PromptArgsRawShape,
    extra: RequestHandlerExtra<ServerRequest, ServerNotification>
  ): Promise<GetPromptResult> => {
    const startedAt = logExecutionStart({
      type: "prompt",
      name: promptName,
      input: args,
      extra,
    });

    try {
      const run = async (): Promise<GetPromptResult> => {
        let response = handler(args, extra);

        // only await if it's actually a promise
        if (response instanceof Promise) {
          response = await response;
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
              `Prompt handler must return a PromptContent object, string, or number. ` +
                `Got ${responseType}: ${responseValue}\n\n` +
                `Validation error: ${validationResult.error}\n\n` +
                `Expected formats:\n` +
                `- String: "your text here"\n` +
                `- Number: 42\n` +
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
        return {
          messages: [
            {
              role,
              content,
            },
          ],
        };
      };

      const result = await run();
      logExecutionEnd({
        type: "prompt",
        name: promptName,
        startedAt,
        extra,
        outputSummary: summarizePromptOutput(result),
      });
      return result;
    } catch (error) {
      logExecutionEnd({
        type: "prompt",
        name: promptName,
        startedAt,
        extra,
        error,
      });
      throw error;
    }
  };
}
