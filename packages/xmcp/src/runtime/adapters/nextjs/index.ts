import type { ServerResponse } from "node:http";
import { nodeToWebAdapter } from "./handler/node-to-web-adapter";
import {
  createMethodNotAllowedResponse,
  sendInternalServerError,
} from "./handler/error-handler";
import {
  createServerLifecycle,
  setupCleanupHandlers,
} from "./handler/server-lifecycle";
import { createIncomingMessage } from "./handler/request-converter";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types";
import { httpRequestContextProvider } from "@/runtime/contexts/http-request-context";
import { randomUUID } from "node:crypto";
import {
  setHttpRequestContext,
} from "@/runtime/contexts/http-request-context";
import { extractClientInfoFromMessages } from "@/runtime/utils/client-info";

const BODY_SIZE_LIMIT = "10mb";

/**
 * Main handler for MCP requests in Next.js runtime.
 * Handles POST requests only, validates, parses, and routes to MCP server.
 */
export async function xmcpHandler(request: Request): Promise<Response> {
  // Only handle POST requests
  if (request.method !== "POST") {
    return createMethodNotAllowedResponse();
  }

  const id = randomUUID();
  const requestHeaders = Object.fromEntries(request.headers.entries());

  return httpRequestContextProvider(
    { id, headers: requestHeaders, clientInfo: undefined },
    () => {
    return nodeToWebAdapter(request.signal, async (res: ServerResponse) => {
      try {
        // Initialize server and transport
        const lifecycle = await createServerLifecycle(BODY_SIZE_LIMIT);

        // Setup cleanup handlers
        setupCleanupHandlers(res, lifecycle);

        // Parse request body
        const bodyContent = await request.json();
        const clientInfo = extractClientInfoFromMessages(bodyContent);
        setHttpRequestContext({ clientInfo });

        // Convert Web Request to Node.js IncomingMessage
        const incomingRequest = createIncomingMessage({
          method: request.method,
          url: request.url,
          headers: requestHeaders,
          auth: request.auth,
        });

        // Handle request through transport
        await lifecycle.transport.handleRequest(
          incomingRequest,
          res,
          bodyContent
        );
      } catch (error) {
        console.error("[Next.js MCP] Error handling MCP request:", error);
        sendInternalServerError(res);
      }
    });
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
