import {
  experimental_withMcpAuth as withMcpAuth,
  createMcpHandler as createVercelMcpHandler,
} from "@vercel/mcp-adapter";
import {
  configureServer,
  INJECTED_CONFIG,
  loadPrompts,
  loadResources,
  loadTools,
} from "@/runtime/utils/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";

export async function xmcpHandler(request: Request): Promise<Response> {
  const [toolPromises, toolModules] = loadTools();
  const [promptPromises, promptModules] = loadPrompts();
  const [resourcePromises, resourceModules] = loadResources();

  await Promise.all(toolPromises);
  await Promise.all(promptPromises);
  await Promise.all(resourcePromises);

  // workaround so it works on any path
  const url = new URL(request.url);
  const currentPath = url.pathname;

  const requestHandler = createVercelMcpHandler(
    (server: McpServer) => {
      configureServer(server, toolModules, promptModules, resourceModules);
    },
    INJECTED_CONFIG,
    {
      streamableHttpEndpoint: currentPath,
      disableSse: true, // we don't need this
    }
  );

  return requestHandler(request);
}

// extract the types from withMcpAuth arguments for auth config
export type VerifyToken = Parameters<typeof withMcpAuth>[1];
export type Options = Parameters<typeof withMcpAuth>[2];

export type AuthConfig = Options & {
  verifyToken: VerifyToken;
};

export function withAuth(
  handler: (request: Request) => Promise<Response>,
  config: AuthConfig
): (request: Request) => Promise<Response> {
  const { verifyToken, ...options } = config;

  return withMcpAuth(handler, verifyToken, options);
}
