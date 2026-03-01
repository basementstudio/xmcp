import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { ZodOptional, ZodType, ZodTypeDef, ZodRawShape } from "zod/v3";
import { PromptFile } from "./server";
import { isZodRawShape, pathToName } from "./tools";
import { transformPromptHandler } from "./transformers/prompt";

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

    if (typeof metadata === "object" && metadata !== null) {
      Object.assign(promptConfig, metadata);
    }

    // Transform the user's handler into an MCP-compatible handler
    const transformedHandler = transformPromptHandler(
      handler,
      (promptConfig.role as "user" | "assistant") || "assistant",
      promptConfig.name
    );

    // Validate and ensure schema is properly typed
    if (isZodRawShape(schema)) {
      Object.assign(promptSchema, schema);
    } else if (schema !== undefined && schema !== null) {
      console.warn(
        `Invalid schema for prompt "${promptConfig.name}" at ${path}. Expected Record<string, z.ZodType>`
      );
    }

    // server as any prevents infinite type recursion
    (server as any).registerPrompt(
      promptConfig.name,
      {
        title: promptConfig.title,
        description: promptConfig.description,
        argsSchema: schema,
      },
      transformedHandler
    );
  });

  return server;
}
