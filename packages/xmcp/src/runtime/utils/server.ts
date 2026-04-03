import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { Implementation } from "@modelcontextprotocol/sdk/types";
import { addToolsToServer } from "./tools";
import { addPromptsToServer, PromptArgsRawShape } from "./prompts";
import { ToolMetadata } from "@/types/tool";
import { PromptMetadata } from "@/types/prompt";
import { UserToolHandler } from "./transformers/tool";
import { UserPromptHandler } from "./transformers/prompt";
import { UserResourceHandler } from "./transformers/resource";
import { ZodRawShape } from "zod/v3";
import { addResourcesToServer } from "./resources";
import { ResourceMetadata } from "@/types/resource";
import { uIResourceRegistry } from "./ext-apps-registry";
import { loadPromptModules, reportPromptLoadIssues } from "./prompt-loader";
import {
  loadResourceModules,
  reportResourceLoadIssues,
} from "./resource-loader";
import { loadToolModules, reportToolLoadIssues } from "./tool-loader";

export type ToolFile = {
  metadata: ToolMetadata;
  schema: ZodRawShape;
  outputSchema?: ZodRawShape;
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

export const injectedTools = INJECTED_TOOLS as Record<
  string,
  () => Promise<ToolFile>
>;

export const injectedPrompts = INJECTED_PROMPTS as Record<
  string,
  () => Promise<PromptFile>
>;

export const injectedResources = INJECTED_RESOURCES as Record<
  string,
  () => Promise<ResourceFile>
>;

export const INJECTED_CONFIG = SERVER_INFO as Implementation;

/* Loads all modules and injects them into the server */
// would be better as a class and use dependency injection perhaps
export async function configureServer(
  server: McpServer,
  toolModules: Map<string, ToolFile>,
  promptModules: Map<string, PromptFile>,
  resourceModules: Map<string, ResourceFile>
): Promise<McpServer> {
  uIResourceRegistry.clear();

  addToolsToServer(server, toolModules);
  addPromptsToServer(server, promptModules);
  addResourcesToServer(server, resourceModules);
  return server;
}

export async function loadTools() {
  const { toolModules, skippedTools } = await loadToolModules(injectedTools);
  reportToolLoadIssues(skippedTools);
  return toolModules;
}

export async function loadPrompts() {
  const { promptModules, skippedPrompts } = await loadPromptModules(
    injectedPrompts
  );
  reportPromptLoadIssues(skippedPrompts);
  return promptModules;
}

export async function loadResources() {
  const { resourceModules, skippedResources } = await loadResourceModules(
    injectedResources
  );
  reportResourceLoadIssues(skippedResources);
  return resourceModules;
}

export async function createServer() {
  const server = new McpServer(INJECTED_CONFIG);
  const toolModulesPromise = loadTools();
  const promptModulesPromise = loadPrompts();
  const resourceModulesPromise = loadResources();
  const [toolModules, promptModules, resourceModules] = await Promise.all([
    toolModulesPromise,
    promptModulesPromise,
    resourceModulesPromise,
  ]);
  return configureServer(server, toolModules, promptModules, resourceModules);
}
