import { createMcpHandler } from "@modelcontextprotocol/server";
import { initializeMcpServer } from "./handler/server-lifecycle";
import { httpRequestContextProvider } from "@/runtime/contexts/http-request-context";
import { randomUUID } from "node:crypto";
import { setHttpRequestContext } from "@/runtime/contexts/http-request-context";
import { extractClientInfoFromMessages } from "@/runtime/utils/client-info";

// A fresh McpServer is built per request; no state survives between requests.
// 2026-07-28 traffic is served natively, 2025-era traffic through the SDK's
// stateless fallback.
const mcpHandler = createMcpHandler(initializeMcpServer, {
  legacy: "stateless",
});

/**
 * Main handler for MCP requests in Next.js runtime.
 * Validates, parses, and routes to the MCP server.
 */
export async function xmcpHandler(request: Request): Promise<Response> {
  const id = randomUUID();
  const requestHeaders = Object.fromEntries(request.headers.entries());

  return httpRequestContextProvider(
    { id, headers: requestHeaders, clientInfo: undefined },
    async () => {
      try {
        let parsedBody: unknown;
        if (request.method === "POST") {
          parsedBody = await request.json().catch(() => undefined);
          setHttpRequestContext({
            clientInfo: extractClientInfoFromMessages(parsedBody),
          });
        }

        return await mcpHandler.fetch(request, {
          authInfo: request.auth,
          parsedBody,
        });
      } catch (error) {
        console.error("[Next.js MCP] Error handling MCP request:", error);
        return Response.json(
          {
            jsonrpc: "2.0",
            error: { code: -32603, message: "Internal server error" },
            id: null,
          },
          { status: 500 }
        );
      }
    }
  );
}

// Re-export auth types and handlers
export {
  withAuth,
  resourceMetadataHandler,
  resourceMetadataOptions,
  type VerifyToken,
  type AuthConfig,
  type OAuthProtectedResourceMetadata,
} from "./auth";

/**
 * MCP Server Card handler for Next.js route files (SEP-1649).
 * Serves server identity and transport metadata at `/.well-known/mcp/server-card.json`,
 * enabling agent discovery clients to auto-configure connections.
 *
 * @example
 * // app/.well-known/mcp/server-card.json/route.ts
 * import { serverCardHandler } from "@xmcp/adapter";
 * export { serverCardHandler as GET };
 */
export function serverCardHandler(request: Request): Response {
  const url = new URL(request.url);
  const reversedName = url.hostname.split(".").reverse().join(".");
  const card: Record<string, unknown> = {
    $schema:
      "https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json",
    name: `${reversedName}/mcp`,
    version: SERVER_INFO.version,
    description: TEMPLATE_CONFIG.description,
    title: TEMPLATE_CONFIG.name,
    remotes: [
      {
        type: "streamable-http",
        url: `${url.origin}${HTTP_CONFIG.endpoint}`,
      },
    ],
  };
  if (TEMPLATE_CONFIG.icons?.length) {
    card.icons = TEMPLATE_CONFIG.icons;
  }
  return Response.json(card, {
    headers: {
      "Content-Type": "application/mcp-server-card+json",
      "Cache-Control": "public, max-age=3600, must-revalidate",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
