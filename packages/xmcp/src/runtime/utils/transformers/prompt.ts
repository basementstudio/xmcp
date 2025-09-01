import {
  GetPromptResult,
  ServerRequest,
  ServerNotification,
} from "@modelcontextprotocol/sdk/types";
import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol";
import { PromptArgsRawShape } from "../prompts";
import { z } from "zod";

/**
 * Type for the original prompt handler that users write
 * The extra parameter is optional for backward compatibility
 */
export type UserPromptHandler = (
  args: PromptArgsRawShape,
  extra?: RequestHandlerExtra<ServerRequest, ServerNotification>
) =>
  | GetPromptResult
  | {
      messages: Array<Pick<GetPromptResult["messages"][number], "content">>;
    }
  | string
  | number
  | Promise<
      | GetPromptResult
      | {
          messages: Array<Pick<GetPromptResult["messages"][number], "content">>;
        }
      | string
      | number
    >;

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
 * 2. Transforms string/number responses into the required GetPromptResult format
 * 3. Adds default role to messages if not specified
 *
 * @param handler - The user's prompt handler function
 * @param defaultRole - The default role to assign to messages ("user" or "assistant")
 * @returns A transformed handler compatible with McpServer.registerPrompt
 */
export function transformPromptHandler(
  handler: UserPromptHandler,
  defaultRole: "user" | "assistant" = "assistant"
): McpPromptHandler {
  return async (
    args: PromptArgsRawShape,
    extra: RequestHandlerExtra<ServerRequest, ServerNotification>
  ): Promise<GetPromptResult> => {
    const response = await handler(args, extra);

    // Transform string/number responses into GetPromptResult format
    if (typeof response === "string" || typeof response === "number") {
      return {
        messages: [
          {
            role: defaultRole,
            content: {
              type: "text" as const,
              text: typeof response === "number" ? `${response}` : response,
            },
          },
        ],
      };
    }

    // Handle partial response with messages array (add role if missing)
    if ("messages" in response && !("role" in response.messages[0])) {
      return {
        messages: response.messages.map((message) => ({
          role: defaultRole,
          content: message.content,
        })),
      };
    }

    // Already a complete GetPromptResult
    return response as GetPromptResult;
  };
}
