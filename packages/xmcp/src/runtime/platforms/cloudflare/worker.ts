import { createServer } from "@/runtime/utils/server";
import { WebStatelessHttpTransport } from "@/runtime/transports/http/web-stateless-http";
import { httpRequestContextProvider } from "@/runtime/contexts/http-request-context";
import homeTemplate from "../../templates/home";

import { addCorsHeaders, handleCorsPreflightRequest } from "./cors";
import type { Env, ExecutionContext } from "./types";
import type { WebMiddleware, WebMiddlewareContext } from "@/types/middleware";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types";

// @ts-expect-error: injected by compiler
const httpConfig = HTTP_CONFIG as {
  port: number;
  host: string;
  bodySizeLimit: string;
  endpoint: string;
  debug: boolean;
};

// @ts-expect-error: injected by compiler
const templateConfig = TEMPLATE_CONFIG as {
  name?: string;
  description?: string;
  homePage?: string;
};

// @ts-expect-error: injected by compiler
const middleware = INJECTED_MIDDLEWARE as
  | (() => Promise<{ default?: WebMiddleware | WebMiddleware[] }>)
  | undefined;

let resolvedMiddlewarePromise: Promise<WebMiddleware[]> | null = null;

async function resolveWebMiddleware(): Promise<WebMiddleware[]> {
  if (!middleware) {
    return [];
  }

  if (!resolvedMiddlewarePromise) {
    resolvedMiddlewarePromise = (async () => {
      try {
        const module = await middleware();
        return normalizeWebMiddleware(module?.default);
      } catch (error) {
        console.error("[Cloudflare-MCP] Failed to load middleware:", error);
        return [];
      }
    })();
  }

  return resolvedMiddlewarePromise;
}

function normalizeWebMiddleware(
  defaultExport: unknown
): WebMiddleware[] {
  if (Array.isArray(defaultExport)) {
    return defaultExport.filter(isWebMiddleware);
  }

  if (isWebMiddleware(defaultExport)) {
    return [defaultExport];
  }

  if (
    defaultExport &&
    typeof defaultExport === "object" &&
    "middleware" in defaultExport &&
    typeof (defaultExport as { middleware?: unknown }).middleware === "function"
  ) {
    return [
      (defaultExport as { middleware: WebMiddleware }).middleware,
    ];
  }

  return [];
}

function isWebMiddleware(value: unknown): value is WebMiddleware {
  return typeof value === "function";
}

async function runWebMiddleware(
  request: Request
): Promise<{ response?: Response; authInfo?: AuthInfo }> {
  const webMiddleware = await resolveWebMiddleware();

  if (webMiddleware.length === 0) {
    return {};
  }

  const context: WebMiddlewareContext = {
    auth: undefined,
    setAuth: (auth) => {
      context.auth = auth;
    },
  };

  for (const handler of webMiddleware) {
    const result = await handler(request, context);
    if (result instanceof Response) {
      return { response: result, authInfo: context.auth };
    }
  }

  return { authInfo: context.auth };
}

/**
 * Log a message if debug mode is enabled
 */
function log(message: string, ...args: unknown[]): void {
  if (httpConfig.debug) {
    console.log(`[Cloudflare-MCP] ${message}`, ...args);
  }
}

/**
 * Handle MCP requests
 */
async function handleMcpRequest(
  request: Request,
  requestOrigin: string | null,
  ctx: ExecutionContext,
  authInfo?: AuthInfo
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
      let server: Awaited<ReturnType<typeof createServer>> | null = null;
      let transport: WebStatelessHttpTransport | null = null;

      try {
        server = await createServer();
        transport = new WebStatelessHttpTransport(httpConfig.debug);

        await server.connect(transport);
        const response = await transport.handleRequest(request, authInfo);

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
      } finally {
        if (server && transport) {
          ctx.waitUntil(
            Promise.allSettled([transport.close(), server.close()])
          );
        }
      }
    });
  });
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
    const mcpEndpoint = httpConfig.endpoint?.startsWith("/")
      ? httpConfig.endpoint
      : `/${httpConfig.endpoint || "mcp"}`;

    // Health check endpoint (no auth required)
    if (pathname === "/health") {
      const response = new Response(
        JSON.stringify({
          status: "ok",
          transport: "cloudflare-workers",
          mode: "stateless",
          auth: "none",
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
      const html = homeTemplate(
        mcpEndpoint,
        templateConfig.name,
        templateConfig.description
      );
      const response = new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
      return addCorsHeaders(response, requestOrigin);
    }

    // MCP endpoint
    if (pathname === mcpEndpoint) {
      try {
        const { response, authInfo } = await runWebMiddleware(request);
        if (response) {
          return addCorsHeaders(response, requestOrigin);
        }
        return handleMcpRequest(request, requestOrigin, _ctx, authInfo);
      } catch (error) {
        console.error("[Cloudflare-MCP] Middleware error:", error);
        const response = new Response(
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
        return addCorsHeaders(response, requestOrigin);
      }
    }

    // 404 for unknown paths
    const response = new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
    return addCorsHeaders(response, requestOrigin);
  },
};
