import {
  createMcpHandler as createVercelMcpHandler,
  experimental_withMcpAuth as withMcpAuth,
} from "@vercel/mcp-adapter";
import {
  configureServer,
  INJECTED_CONFIG,
  loadTools,
} from "@/runtime/utils/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";

export async function xmcpHandler(request: Request): Promise<Response> {
  const [toolPromises, toolModules] = loadTools();

  await Promise.all(toolPromises);

  const requestHandler = createVercelMcpHandler((server: McpServer) => {
    configureServer(server, toolModules);
  }, INJECTED_CONFIG);

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
