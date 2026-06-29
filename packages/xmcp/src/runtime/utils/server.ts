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
import type { TaskStore } from "@/types/task";
import type { TaskStore as SdkTaskStore } from "@modelcontextprotocol/sdk/experimental/tasks/interfaces";
import { coerceToolResponse } from "./transformers/tool";

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

export const INJECTED_CONFIG = SERVER_INFO as Implementation & { instructions?: string };

const injectedTaskStore = INJECTED_TASK_STORE;

/** Loads the user-provided task store (src/task-store.ts), if present. */
export async function loadTaskStore(): Promise<TaskStore | undefined> {
  if (!injectedTaskStore) return undefined;
  const module = await injectedTaskStore();
  return module?.default ?? module?.taskStore;
}

/**
 * Wraps a task store so `getTaskResult` applies the same string/number → result
 * coercion xmcp does on a synchronous tool return. An out-of-band worker can
 * store a plain string and the client still receives a valid CallToolResult.
 * Only primitives are coerced; objects/arrays (already-valid results, failed
 * envelopes, etc.) pass through unchanged.
 */
export function wrapTaskStore(store: TaskStore): SdkTaskStore {
  return {
    createTask: (...args) => store.createTask(...args),
    getTask: (...args) => store.getTask(...args),
    storeTaskResult: (...args) => store.storeTaskResult(...args),
    updateTaskStatus: (...args) => store.updateTaskStatus(...args),
    listTasks: (...args) => store.listTasks(...args),
    getTaskResult: async (taskId, sessionId) => {
      const result = await store.getTaskResult(taskId, sessionId);
      if (typeof result === "string" || typeof result === "number") {
        return coerceToolResponse(result, {}, undefined, undefined, "task");
      }
      return result;
    },
  };
}

/* Loads all modules and injects them into the server */
// would be better as a class and use dependency injection perhaps
export async function configureServer(
  server: McpServer,
  toolModules: Map<string, ToolFile>,
  promptModules: Map<string, PromptFile>,
  resourceModules: Map<string, ResourceFile>,
  hasTaskStore = false
): Promise<McpServer> {
  uIResourceRegistry.clear();

  if (hasTaskStore) {
    // Advertise task support so clients may augment tools/call with a task.
    // Security note: stateless HTTP has no requestor identity, so task IDs are
    // the only access control. Use cryptographically secure IDs in the store.
    server.server.registerCapabilities({
      tasks: {
        list: {},
        cancel: {},
        requests: { tools: { call: {} } },
      },
    });
  }

  addToolsToServer(server, toolModules, hasTaskStore);
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
  const { instructions, ...serverInfo } = INJECTED_CONFIG;
  const toolModulesPromise = loadTools();
  const promptModulesPromise = loadPrompts();
  const resourceModulesPromise = loadResources();
  const taskStorePromise = loadTaskStore();
  const [toolModules, promptModules, resourceModules, taskStore] =
    await Promise.all([
      toolModulesPromise,
      promptModulesPromise,
      resourceModulesPromise,
      taskStorePromise,
    ]);
  // Passing a task store enables the SDK's tasks/* request handlers.
  const server = new McpServer(serverInfo, {
    instructions,
    taskStore: taskStore ? wrapTaskStore(taskStore) : undefined,
  });
  return configureServer(
    server,
    toolModules,
    promptModules,
    resourceModules,
    Boolean(taskStore)
  );
}
