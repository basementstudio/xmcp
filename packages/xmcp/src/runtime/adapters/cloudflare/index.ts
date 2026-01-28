import { createServer } from "@/runtime/utils/server";
import { WebStatelessHttpTransport } from "@/runtime/transports/http/web-stateless-http";
import { httpRequestContextProvider } from "@/runtime/contexts/http-request-context";
import homeTemplate from "../../templates/home";

// Import from extracted modules
import { addCorsHeaders, handleCorsPreflightRequest } from "./cors";
import { handleProtectedResourceMetadata } from "./oauth-metadata";
import { handleAuthorizationServerMetadata } from "./oauth-authorization-server-metadata";
import { getOAuthConfig, runMiddleware } from "./auth";
import type { AuthInfo } from "./middleware/types";
import type { Env, ExecutionContext } from "./types";

// Re-export shared types
export type { Env, ExecutionContext } from "./types";

// HTTP config - injected by compiler as combined object
// @ts-expect-error: injected by compiler
const httpConfig = HTTP_CONFIG as {
  port: number;
  host: string;
  bodySizeLimit: string;
  endpoint: string;
  debug: boolean;
};

// Template config - injected by compiler as combined object
// @ts-expect-error: injected by compiler
const templateConfig = TEMPLATE_CONFIG as {
  name?: string;
  description?: string;
  homePage?: string;
};

// Destructure for easier access
const { debug, endpoint: httpEndpoint } = httpConfig;
const { name: templateName, description: templateDescription } = templateConfig;

/**
 * Log a message if debug mode is enabled
 */
function log(message: string, ...args: unknown[]): void {
  if (debug) {
    console.log(`[Cloudflare-MCP] ${message}`, ...args);
  }
}

/**
 * Handle MCP requests
 */
async function handleMcpRequest(
  request: Request,
  requestOrigin: string | null,
  authInfo: AuthInfo | null
): Promise<Response> {
  const requestId = crypto.randomUUID();

  // Use the http request context provider to maintain request isolation
  return new Promise<Response>((resolve) => {
    // Convert Web Request headers to a format compatible with httpRequestContext
    const headers: Record<string, string | string[] | undefined> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    httpRequestContextProvider({ id: requestId, headers }, async () => {
      try {
        const server = await createServer();
        const transport = new WebStatelessHttpTransport(debug);

        await server.connect(transport);
        // Pass auth info to transport if available
        const response = await transport.handleRequest(
          request,
          authInfo || undefined
        );

        // Cleanup
        await transport.close();
        await server.close();

        resolve(addCorsHeaders(response, requestOrigin));
      } catch (error) {
        console.error("[Cloudflare-MCP] Error handling MCP request:", error);
        const errorResponse = new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32603,
              message: "Internal server error",
            },
            id: null,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
        resolve(addCorsHeaders(errorResponse, requestOrigin));
      }
    });
  });
}

/**
 * Determine which auth methods are enabled
 */
function getAuthStatus(env: Env): string {
  const hasOAuth = !!getOAuthConfig(env);
  const hasApiKey = !!env.MCP_API_KEY;

  if (hasOAuth && hasApiKey) return "oauth+api-key";
  if (hasOAuth) return "oauth";
  if (hasApiKey) return "api-key";
  return "none";
}

/**
 * Cloudflare Workers fetch handler
 */
export default {
  async fetch(
    request: Request,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const requestOrigin = request.headers.get("origin");

    log(`${request.method} ${pathname}`);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return handleCorsPreflightRequest(requestOrigin);
    }

    // Normalize the MCP endpoint path
    const mcpEndpoint = httpEndpoint?.startsWith("/")
      ? httpEndpoint
      : `/${httpEndpoint || "mcp"}`;

    // OAuth Protected Resource Metadata endpoint (RFC 9728)
    if (pathname === "/.well-known/oauth-protected-resource") {
      return handleProtectedResourceMetadata(request, env, requestOrigin);
    }

    // OAuth Authorization Server Metadata endpoint
    if (pathname === "/.well-known/oauth-authorization-server") {
      return handleAuthorizationServerMetadata(request, env, requestOrigin);
    }

    // Health check endpoint (no auth required)
    if (pathname === "/health") {
      const response = new Response(
        JSON.stringify({
          status: "ok",
          transport: "cloudflare-workers",
          mode: "stateless",
          auth: getAuthStatus(env),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
      return addCorsHeaders(response, requestOrigin);
    }

    // Home page (no auth required)
    if (pathname === "/" && request.method === "GET") {
      const html = homeTemplate(mcpEndpoint, templateName, templateDescription);
      const response = new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
      return addCorsHeaders(response, requestOrigin);
    }

    // MCP endpoint (auth required if configured)
    if (pathname === mcpEndpoint) {
      const authResult = await runMiddleware(request, env, _ctx, requestOrigin);
      if ("error" in authResult) {
        return authResult.error;
      }
      return handleMcpRequest(request, requestOrigin, authResult.authInfo);
    }

    // 404 for unknown paths
    const response = new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
    return addCorsHeaders(response, requestOrigin);
  },
};

// Re-export types for users
export type { CloudflareOAuthConfig, OAuthAuthInfo } from "./auth/types";
export { cloudflareAuthMiddleware } from "./middleware/auth";
export type {
  CloudflareMiddleware,
  CloudflareAuthConfig,
  AuthInfo as CloudflareAuthInfo,
  NextFunction,
} from "./middleware/types";
