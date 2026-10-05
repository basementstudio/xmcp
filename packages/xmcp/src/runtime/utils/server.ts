import { McpServer, Implementation } from "@modelcontextprotocol/server";
import { filterComponents } from "./component-visibility";
import { addToolsToServer } from "./tools";
import { addPromptsToServer, PromptArgsRawShape } from "./prompts";
import { ToolMetadata } from "@/types/tool";
import { PromptMetadata } from "@/types/prompt";
import { UserToolHandler } from "./transformers/tool";
import { UserPromptHandler } from "./transformers/prompt";
import { UserResourceHandler } from "./transformers/resource";
import { ZodRawShape } from "zod/v3";
import { addResourcesToServer } from "./resources";
import { ResourceMetadata, ResourceCompletions } from "@/types/resource";
import { uIResourceRegistry } from "./ext-apps-registry";
import { loadPromptModules, reportPromptLoadIssues } from "./prompt-loader";
import {
  loadResourceModules,
  reportResourceLoadIssues,
} from "./resource-loader";
import { loadToolModules, reportToolLoadIssues } from "./tool-loader";
import {
  normalizeMcpMiddleware,
  registerWithMcpMiddleware,
} from "./mcp-middleware";

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
  complete?: ResourceCompletions;
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

export const INJECTED_CONFIG = SERVER_INFO as Implementation & {
  instructions?: string;
};

/* Loads all modules and injects them into the server */
// would be better as a class and use dependency injection perhaps
export async function configureServer(
  server: McpServer,
  toolModules: Map<string, ToolFile>,
  promptModules: Map<string, PromptFile>,
  resourceModules: Map<string, ResourceFile>
): Promise<McpServer> {
  // Shared setup also serves STDIO and adapters that do not mount HTTP middleware.
  const middlewareModule = await INJECTED_MIDDLEWARE?.();
  const middleware = normalizeMcpMiddleware(middlewareModule?.mcp);
  uIResourceRegistry.clear();
  // Older compilers do not inject this optional configuration.
  const components =
    typeof COMPONENTS_CONFIG === "undefined" ? undefined : COMPONENTS_CONFIG;

  registerWithMcpMiddleware(server, middleware, () => {
    addToolsToServer(
      server,
      filterComponents(toolModules, components),
      middleware
    );
    addPromptsToServer(server, filterComponents(promptModules, components));
    addResourcesToServer(server, filterComponents(resourceModules, components));
  });
  return server;
}

export async function loadTools() {
  const { toolModules, skippedTools } = await loadToolModules(injectedTools);
  reportToolLoadIssues(skippedTools);
  return toolModules;
}

export async function loadPrompts() {
  const { promptModules, skippedPrompts } =
    await loadPromptModules(injectedPrompts);
  reportPromptLoadIssues(skippedPrompts);
  return promptModules;
}

export async function loadResources() {
  const { resourceModules, skippedResources } =
    await loadResourceModules(injectedResources);
  reportResourceLoadIssues(skippedResources);
  return resourceModules;
}

export async function createServer() {
  const { instructions, ...serverInfo } = INJECTED_CONFIG;
  const server = new McpServer(serverInfo, { instructions });
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
