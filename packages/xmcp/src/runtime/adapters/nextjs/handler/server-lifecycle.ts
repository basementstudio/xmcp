import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import type { ServerResponse } from "node:http";
import { StatelessHttpServerTransport } from "@/runtime/transports/http/stateless-streamable-http";
import {
  configureServer,
  INJECTED_CONFIG,
  loadPrompts,
  loadResources,
  loadTools,
} from "@/runtime/utils/server";

export interface ServerLifecycle {
  server: McpServer;
  transport: StatelessHttpServerTransport;
}

/**
 * Sets up cleanup handlers for server and transport
 */
export function setupCleanupHandlers(
  res: ServerResponse,
  lifecycle: ServerLifecycle
): void {
  const cleanup = () => {
    lifecycle.transport.close();
    lifecycle.server.close();
  };

  // Cleanup when request/connection closes
  res.on("close", cleanup);

  // Cleanup on finish
  res.on("finish", cleanup);
}

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

  const server = new McpServer(INJECTED_CONFIG);

  await configureServer(server, toolModules, promptModules, resourceModules);

  return server;
}

/**
 * Creates and connects server lifecycle components
 */
export async function createServerLifecycle(
  bodySizeLimit: string = "10mb"
): Promise<ServerLifecycle> {
  const server = await initializeMcpServer();
  const transport = new StatelessHttpServerTransport(false, bodySizeLimit);

  await server.connect(transport);

  return { server, transport };
}
