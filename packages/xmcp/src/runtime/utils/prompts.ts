import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { ZodOptional, ZodType, ZodTypeDef } from "zod";
import { PromptFile } from "./server";
import { isZodRawShape, pathToName, ZodRawShape } from "./tools";
import { GetPromptResult } from "@modelcontextprotocol/sdk/types";

interface PromptMetadata {
  name: string;
  title: string;
  description: string;
  role?: string;
}

export type PromptArgsRawShape = {
  [k: string]:
    | ZodType<string, ZodTypeDef, string>
    | ZodOptional<ZodType<string, ZodTypeDef, string>>;
};

/** Loads prompts and injects them into the server */
export function addPromptsToServer(
  server: McpServer,
  promptModules: Map<string, PromptFile>
): McpServer {
  promptModules.forEach((promptModule, path) => {
    const defaultName = pathToName(path);

    const promptConfig: PromptMetadata = {
      name: defaultName,
      title: defaultName,
      description: "No description provided",
    };
    let promptSchema: ZodRawShape = {};

    const { default: handler, metadata, schema } = promptModule;

    // intercept the handler to add the role to the messages
    const interceptedHandler = async (args: any): Promise<GetPromptResult> => {
      const response = (await handler.apply(null, args)) as
        | {
            messages: Array<
              Pick<GetPromptResult["messages"][number], "content">
            >;
          }
        | string
        | number;

      const resolvedResponse = await Promise.resolve(response);

      if (
        typeof resolvedResponse === "string" ||
        typeof resolvedResponse === "number"
      ) {
        return {
          messages: [
            {
              role: (promptConfig.role as "user" | "assistant") || "assistant",
              content: {
                type: "text" as const,
                text:
                  typeof resolvedResponse === "number"
                    ? `${resolvedResponse}`
                    : resolvedResponse,
              },
            },
          ],
        };
      }

      return {
        messages: resolvedResponse.messages.map((message) => ({
          role: (promptConfig.role as "user" | "assistant") || "assistant",
          content: message.content, // for custom content
        })),
      };
    };

    if (typeof metadata === "object" && metadata !== null) {
      Object.assign(promptConfig, metadata);
    }

    // Validate and ensure schema is properly typed
    if (isZodRawShape(schema)) {
      Object.assign(promptSchema, schema);
    } else if (schema !== undefined && schema !== null) {
      console.warn(
        `Invalid schema for prompt "${promptConfig.name}" at ${path}. Expected Record<string, z.ZodType>`
      );
    }

    server.registerPrompt(
      promptConfig.name,
      {
        title: promptConfig.title,
        description: promptConfig.description,
        argsSchema: schema as any,
      },
      interceptedHandler
    );
  });

  return server;
}
