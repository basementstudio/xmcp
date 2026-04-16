import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { Implementation } from "@modelcontextprotocol/sdk/types";
import {
  addToolsToServer,
  prepareToolRegistry,
  registerToolsForRequest,
  type ToolRegistry,
} from "./tools";
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
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types";
import { debugWarn } from "./debug";

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

// Dedupe the auth-gated-tools warning so HTTP transports without auth
// middleware don't spam stderr on every unauthenticated request.
let authlessWarningEmitted = false;

function warnOnUnreachableAuthTools(
  toolModules: Map<string, ToolFile>,
  authInfo: AuthInfo | undefined
): void {
  if (authInfo || authlessWarningEmitted) return;

  const skipped: string[] = [];
  for (const tool of toolModules.values()) {
    const m = tool.metadata;
    if (
      m &&
      (m.requiresAuth === true ||
        (Array.isArray(m.requiredScopes) && m.requiredScopes.length > 0))
    ) {
      skipped.push(typeof m.name === "string" ? m.name : "<unnamed>");
    }
  }

  if (skipped.length === 0) return;

  console.warn(
    `[xmcp] ${skipped.length} auth-gated tool(s) skipped: this transport did not provide authInfo. See https://xmcp.dev/docs/guides/dynamic-tool-discovery#auth-on-stdio`
  );
  debugWarn(`[xmcp] Auth-gated tools skipped: ${skipped.join(", ")}`);
  authlessWarningEmitted = true;
}

/* Loads all modules and injects them into the server */
// would be better as a class and use dependency injection perhaps
export async function configureServer(
  server: McpServer,
  toolModules: Map<string, ToolFile>,
  promptModules: Map<string, PromptFile>,
  resourceModules: Map<string, ResourceFile>,
  authInfo?: AuthInfo,
  enableList?: string[],
  toolRegistry?: ToolRegistry
): Promise<McpServer> {
  uIResourceRegistry.clear();

  warnOnUnreachableAuthTools(toolModules, authInfo);

  if (toolRegistry) {
    registerToolsForRequest(server, toolRegistry, authInfo, enableList);
  } else {
    addToolsToServer(server, toolModules, authInfo, enableList);
  }
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

export const enableList: string[] | undefined =
  typeof INJECTED_TOOLS_ENABLE !== "undefined"
    ? INJECTED_TOOLS_ENABLE
    : undefined;

type ServerBundle = {
  toolModules: Map<string, ToolFile>;
  promptModules: Map<string, PromptFile>;
  resourceModules: Map<string, ResourceFile>;
  toolRegistry: ToolRegistry;
};

// Cache the module load + tool-registry prep so HTTP transports don't
// re-extract metadata / re-check duplicates per request. Skipped in dev mode
// where `xmcp dev` hot-reloads the bundle.
let cachedBundle: ServerBundle | null = null;

function isDevMode(): boolean {
  return process.env.NODE_ENV === "development";
}

async function getServerBundle(): Promise<ServerBundle> {
  if (!isDevMode() && cachedBundle) return cachedBundle;

  const [toolModules, promptModules, resourceModules] = await Promise.all([
    loadTools(),
    loadPrompts(),
    loadResources(),
  ]);

  const bundle: ServerBundle = {
    toolModules,
    promptModules,
    resourceModules,
    toolRegistry: prepareToolRegistry(toolModules),
  };

  if (!isDevMode()) cachedBundle = bundle;
  return bundle;
}

export async function createServer(authInfo?: AuthInfo) {
  const server = new McpServer(INJECTED_CONFIG);
  const bundle = await getServerBundle();
  return configureServer(
    server,
    bundle.toolModules,
    bundle.promptModules,
    bundle.resourceModules,
    authInfo,
    enableList,
    bundle.toolRegistry
  );
}
