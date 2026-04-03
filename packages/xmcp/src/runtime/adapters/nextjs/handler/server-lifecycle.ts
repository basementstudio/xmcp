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
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types";

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
export async function initializeMcpServer(
  authInfo?: AuthInfo
): Promise<McpServer> {
  const toolModulesPromise = loadTools();
  const [promptPromises, promptModules] = loadPrompts();
  const [resourcePromises, resourceModules] = loadResources();

  await Promise.all([
    toolModulesPromise,
    ...promptPromises,
    ...resourcePromises,
  ]);
  const toolModules = await toolModulesPromise;

  const server = new McpServer(INJECTED_CONFIG);

  const enableList =
    typeof INJECTED_TOOLS_ENABLE !== "undefined"
      ? INJECTED_TOOLS_ENABLE
      : undefined;

  await configureServer(
    server,
    toolModules,
    promptModules,
    resourceModules,
    authInfo,
    enableList
  );

  return server;
}

/**
 * Creates and connects server lifecycle components
 */
export async function createServerLifecycle(
  bodySizeLimit: string = "10mb",
  authInfo?: AuthInfo
): Promise<ServerLifecycle> {
  const server = await initializeMcpServer(authInfo);
  const transport = new StatelessHttpServerTransport(false, bodySizeLimit);

  await server.connect(transport);

  return { server, transport };
}
