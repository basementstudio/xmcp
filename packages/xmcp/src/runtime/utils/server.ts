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
import { addNotificationsToServer } from "./notifications";
import { ResourceMetadata } from "@/types/resource";
import { uIResourceRegistry } from "./ext-apps-registry";
import { loadToolModules, reportToolLoadIssues } from "./tool-loader";
import type { NotificationsConfig } from "@/types/notification";

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

const injectedNotifications = INJECTED_NOTIFICATIONS as
  | (() => Promise<{ default?: NotificationsConfig }>)
  | undefined;

export const INJECTED_CONFIG = SERVER_INFO as Implementation;

/* Loads all modules and injects them into the server */
// would be better as a class and use dependency injection perhaps
export async function configureServer(
  server: McpServer,
  toolModules: Map<string, ToolFile>,
  promptModules: Map<string, PromptFile>,
  resourceModules: Map<string, ResourceFile>,
  notificationsConfig: NotificationsConfig | undefined
): Promise<McpServer> {
  uIResourceRegistry.clear();

  addToolsToServer(server, toolModules);
  addPromptsToServer(server, promptModules);
  addResourcesToServer(server, resourceModules);
  addNotificationsToServer(server, notificationsConfig);
  return server;
}

export async function loadTools() {
  const { toolModules, skippedTools } = await loadToolModules(injectedTools);
  reportToolLoadIssues(skippedTools);
  return toolModules;
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

export async function loadNotificationsConfig(): Promise<
  NotificationsConfig | undefined
> {
  if (!injectedNotifications) return undefined;
  const mod = await injectedNotifications();
  return mod?.default;
}

export async function createServer() {
  const server = new McpServer(INJECTED_CONFIG);
  const toolModulesPromise = loadTools();
  const [promptPromises, promptModules] = loadPrompts();
  const [resourcePromises, resourceModules] = loadResources();
  const notificationsConfigPromise = loadNotificationsConfig();
  await Promise.all([
    toolModulesPromise,
    ...promptPromises,
    ...resourcePromises,
    notificationsConfigPromise,
  ]);
  const toolModules = await toolModulesPromise;
  const notificationsConfig = await notificationsConfigPromise;
  return configureServer(
    server,
    toolModules,
    promptModules,
    resourceModules,
    notificationsConfig
  );
}
