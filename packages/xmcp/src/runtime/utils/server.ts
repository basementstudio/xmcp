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
import {
  loadToolsFromInjected,
  logToolLoadSummary,
} from "./tool-loading";
import type { ToolLoadReport } from "./tool-loading";
import { uIResourceRegistry } from "./ext-apps-registry";

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
} as const satisfies Implementation;

export type {
  ToolModuleValidationReason,
  ToolLoadSkipReason,
  ToolLoadReport,
} from "./tool-loading";
export {
  validateToolModule,
  logToolLoadSummary,
  resetToolLoadingDiagnosticsForTests,
} from "./tool-loading";

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

export function loadTools() {
  return loadToolsFromInjected<ToolFile>(
    injectedTools as Record<string, () => Promise<unknown>>
  );
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

let toolDiagnosticsPreloadPromise: Promise<ToolLoadReport> | null = null;

export async function preloadToolLoadingDiagnostics(): Promise<ToolLoadReport> {
  if (!toolDiagnosticsPreloadPromise) {
    const [toolPromises, , toolLoadReport] = loadTools();
    toolDiagnosticsPreloadPromise = Promise.all(toolPromises).then(() => {
      logToolLoadSummary(toolLoadReport);
      return toolLoadReport;
    });
  }

  return toolDiagnosticsPreloadPromise;
}

export async function createServer() {
  const server = new McpServer(INJECTED_CONFIG);
  const [toolPromises, toolModules, toolLoadReport] = loadTools();
  const [promptPromises, promptModules] = loadPrompts();
  const [resourcePromises, resourceModules] = loadResources();
  await Promise.all(toolPromises);
  await Promise.all(promptPromises);
  await Promise.all(resourcePromises);
  logToolLoadSummary(toolLoadReport);
  return configureServer(server, toolModules, promptModules, resourceModules);
}
