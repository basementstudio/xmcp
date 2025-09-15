import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { Implementation } from "@modelcontextprotocol/sdk/types";
import { addToolsToServer } from "./tools";
import { addPromptsToServer, PromptArgsRawShape } from "./prompts";
import { ToolMetadata } from "@/types/tool";
import { PromptMetadata } from "@/types/prompt";
import { UserToolHandler } from "./transformers/tool";
import { UserPromptHandler } from "./transformers/prompt";
import { UserResourceHandler } from "./transformers/resource";
import { ZodRawShape } from "zod";
import { addResourcesToServer } from "./resources";
import { ResourceMetadata } from "@/types/resource";

export type ToolFile = {
  metadata: ToolMetadata;
  schema: ZodRawShape;
  default: UserToolHandler;
};

export type PromptFile = {
  metadata: PromptMetadata;
  schema: PromptArgsRawShape;
  default: UserPromptHandler;
};

export type ResourceFile = {
  metadata: ResourceMetadata;
  schema: ZodRawShape;
  default: UserResourceHandler;
};

// @ts-expect-error: injected by compiler
export const injectedTools = INJECTED_TOOLS as Record<
  string,
  () => Promise<ToolFile>
>;

// @ts-expect-error: injected by compiler
export const injectedPrompts = INJECTED_PROMPTS as Record<
  string,
  () => Promise<PromptFile>
>;

// @ts-expect-error: injected by compiler
export const injectedResources = INJECTED_RESOURCES as Record<
  string,
  () => Promise<ResourceFile>
>;

export const INJECTED_CONFIG = {
  // TODO get from project config
  name: "MCP Server",
  version: "0.0.1",
  capabilities: {
    tools: {
      listChanged: true,
    },
    prompts: {
      listChanged: true,
    },
    resources: {
      listChanged: true,
      subscribe: true,
    },
  },
} as const satisfies Implementation;

/* Loads all modules and injects them into the server */
// would be better as a class and use dependency injection perhaps
export async function configureServer(
  server: McpServer,
  toolModules: Map<string, ToolFile>,
  promptModules: Map<string, PromptFile>,
  resourceModules: Map<string, ResourceFile>
): Promise<McpServer> {
  addToolsToServer(server, toolModules);
  addPromptsToServer(server, promptModules);
  addResourcesToServer(server, resourceModules);
  return server;
}

export function loadTools() {
  const toolModules = new Map<string, ToolFile>();

  const toolPromises = Object.keys(injectedTools).map((path) =>
    injectedTools[path]().then((toolModule) => {
      toolModules.set(path, toolModule);
    })
  );

  return [toolPromises, toolModules] as const;
}

export function loadPrompts() {
  const promptModules = new Map<string, PromptFile>();

  const promptPromises = Object.keys(injectedPrompts).map((path) =>
    injectedPrompts[path]().then((promptModule) => {
      promptModules.set(path, promptModule);
    })
  );

  return [promptPromises, promptModules] as const;
}

export function loadResources() {
  const resourceModules = new Map<string, ResourceFile>();

  const resourcePromises = Object.keys(injectedResources).map((path) =>
    injectedResources[path]().then((resourceModule) => {
      resourceModules.set(path, resourceModule);
    })
  );

  return [resourcePromises, resourceModules] as const;
}

export async function createServer() {
  const server = new McpServer(INJECTED_CONFIG);
  const [toolPromises, toolModules] = loadTools();
  const [promptPromises, promptModules] = loadPrompts();
  const [resourcePromises, resourceModules] = loadResources();
  await Promise.all(toolPromises);
  await Promise.all(promptPromises);
  await Promise.all(resourcePromises);
  return configureServer(server, toolModules, promptModules, resourceModules);
}
