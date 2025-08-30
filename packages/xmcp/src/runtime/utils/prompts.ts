import {
  McpServer,
  PromptCallback,
} from "@modelcontextprotocol/sdk/server/mcp";
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
    const interceptedHandler: PromptCallback = async (extra) => {
      const response = (await handler.apply(null, [extra])) as
        | GetPromptResult
        | string
        | number;

      if (typeof response === "string" || typeof response === "number") {
        return {
          messages: [
            {
              role: (promptConfig.role as "user" | "assistant") || "assistant",
              content: {
                type: "text",
                text: typeof response === "number" ? `${response}` : response,
              },
            },
          ],
        };
      }

      return response;
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

    /*     server.registerPrompt(
      promptConfig.name,
      {
        title: promptConfig.title,
        description: promptConfig.description,
        argsSchema: schema,
      },
      interceptedHandler
    ); */

    server.prompt(
      promptConfig.name,
      promptConfig.description,
      promptSchema as any,
      interceptedHandler
    );
  });

  return server;
}
