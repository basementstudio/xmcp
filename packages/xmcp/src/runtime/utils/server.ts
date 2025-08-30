import {
  McpServer,
  PromptCallback,
  ToolCallback,
} from "@modelcontextprotocol/sdk/server/mcp";
import { Implementation } from "@modelcontextprotocol/sdk/types";
import { addToolsToServer } from "./tools";
import { addPromptsToServer, PromptArgsRawShape } from "./prompts";

export type ToolFile = {
  metadata: unknown;
  schema: unknown;
  default: ToolCallback;
};

export type PromptFile = {
  metadata: unknown;
  schema: PromptArgsRawShape;
  default: PromptCallback;
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
  },
} as const satisfies Implementation;

/** Loads tools and injects them into the server */
export async function configureServer(
  server: McpServer,
  toolModules: Map<string, ToolFile>,
  promptModules: Map<string, PromptFile>
): Promise<McpServer> {
  addToolsToServer(server, toolModules);
  addPromptsToServer(server, promptModules);
  // TODO: implement addResourcesToServer
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

export async function createServer() {
  const server = new McpServer(INJECTED_CONFIG);
  const [toolPromises, toolModules] = loadTools();
  const [promptPromises, promptModules] = loadPrompts();
  await Promise.all(toolPromises);
  await Promise.all(promptPromises);
  return configureServer(server, toolModules, promptModules);
}
