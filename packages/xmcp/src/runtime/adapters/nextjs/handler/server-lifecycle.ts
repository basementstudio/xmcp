import { McpServer } from "@modelcontextprotocol/server";
import {
  configureServer,
  INJECTED_CONFIG,
  loadPrompts,
  loadResources,
  loadTools,
} from "@/runtime/utils/server";

/**
 * Initializes and configures the MCP server with tools, prompts, and resources
 */
export async function initializeMcpServer(): Promise<McpServer> {
  const toolModulesPromise = loadTools();
  const promptModulesPromise = loadPrompts();
  const resourceModulesPromise = loadResources();
  const [toolModules, promptModules, resourceModules] = await Promise.all([
    toolModulesPromise,
    promptModulesPromise,
    resourceModulesPromise,
  ]);

  const { instructions, ...serverInfo } = INJECTED_CONFIG;
  const server = new McpServer(serverInfo, { instructions });

  await configureServer(server, toolModules, promptModules, resourceModules);

  return server;
}
