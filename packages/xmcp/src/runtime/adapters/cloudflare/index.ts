import { createServer } from "@/runtime/utils/server";
import { WebStatelessHttpTransport } from "@/runtime/transports/http/web-stateless-http";
import { httpRequestContextProvider } from "@/runtime/contexts/http-request-context";
import homeTemplate from "../../templates/home";
import { verifyJWT, JWTVerificationError } from "./auth/jwt";
import type {
  CloudflareOAuthConfig,
  OAuthAuthInfo,
  OAuthProtectedResourceMetadata,
} from "./auth/types";

// HTTP config - injected by compiler as combined object
// @ts-expect-error: injected by compiler
const httpConfig = HTTP_CONFIG as {
  port: number;
  host: string;
  bodySizeLimit: string;
  endpoint: string;
  debug: boolean;
};

// CORS config - injected by compiler as combined object
// @ts-expect-error: injected by compiler
const corsConfig = HTTP_CORS_CONFIG as {
  origin: string;
  methods: string;
  allowedHeaders: string;
  exposedHeaders: string;
  credentials: boolean;
  maxAge: number;
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
const {
  origin: corsOrigin,
  methods: corsMethods,
  allowedHeaders: corsAllowedHeaders,
  exposedHeaders: corsExposedHeaders,
  credentials: corsCredentials,
  maxAge: corsMaxAge,
} = corsConfig;
const { name: templateName, description: templateDescription } = templateConfig;

/**
 * Cloudflare Workers environment bindings.
 * Users can extend this with their own bindings.
 */
export interface Env {
  /**
   * Optional API key for authenticating MCP requests.
   * Set via: wrangler secret put MCP_API_KEY
   * Clients must send: Authorization: Bearer <key>
   */
  MCP_API_KEY?: string;

  // ===== OAuth Configuration =====
  // Option 1: JSON config (most flexible)
  /**
   * Full OAuth configuration as JSON string.
   * Example: {"issuer":"https://your-domain.auth0.com/","audience":"https://your-api","authorizationServers":["https://your-domain.auth0.com"]}
   */
  MCP_OAUTH_CONFIG?: string;

  // Option 2: Individual env vars (simpler setup)
  /**
   * OAuth issuer URL (e.g., "https://your-domain.auth0.com/")
   */
  MCP_OAUTH_ISSUER?: string;

  /**
   * Expected audience for JWT validation
   */
  MCP_OAUTH_AUDIENCE?: string;

  /**
   * Comma-separated list of authorization servers
   */
  MCP_OAUTH_AUTHORIZATION_SERVERS?: string;

  /**
   * Comma-separated list of required scopes (optional)
   */
  MCP_OAUTH_REQUIRED_SCOPES?: string;

  /**
   * Custom JWKS URI (optional, derived from issuer by default)
   */
  MCP_OAUTH_JWKS_URI?: string;

  /**
   * Additional user-defined bindings (KV, D1, etc.)
   */
  [key: string]: unknown;
}

// Cloudflare Workers ExecutionContext type
export interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

/**
 * Auth info passed to MCP transport (supports both API key and OAuth)
 */
type AuthInfo = {
  token: string;
  clientId: string;
  scopes: string[];
  expiresAt?: number;
  extra?: Record<string, unknown>;
};

/**
 * Parse OAuth configuration from environment variables.
 * Returns null if OAuth is not configured.
 */
function getOAuthConfig(env: Env): CloudflareOAuthConfig | null {
  // Option 1: Full JSON config
  if (env.MCP_OAUTH_CONFIG) {
    try {
      return JSON.parse(env.MCP_OAUTH_CONFIG) as CloudflareOAuthConfig;
    } catch {
      console.error(
        "[Cloudflare-MCP] Failed to parse MCP_OAUTH_CONFIG as JSON"
      );
      return null;
    }
  }

  // Option 2: Individual env vars
  if (env.MCP_OAUTH_ISSUER && env.MCP_OAUTH_AUDIENCE) {
    const authServers = env.MCP_OAUTH_AUTHORIZATION_SERVERS
      ? env.MCP_OAUTH_AUTHORIZATION_SERVERS.split(",").map((s) => s.trim())
      : [env.MCP_OAUTH_ISSUER.replace(/\/$/, "")]; // Default to issuer

    return {
      issuer: env.MCP_OAUTH_ISSUER,
      audience: env.MCP_OAUTH_AUDIENCE,
      authorizationServers: authServers,
      requiredScopes: env.MCP_OAUTH_REQUIRED_SCOPES
        ? env.MCP_OAUTH_REQUIRED_SCOPES.split(",").map((s) => s.trim())
        : undefined,
      jwksUri: env.MCP_OAUTH_JWKS_URI,
    };
  }

  return null;
}

/**
 * Create an unauthorized response with proper headers
 */
function createUnauthorizedResponse(
  message: string,
  requestOrigin: string | null
): Response {
  return addCorsHeaders(
    new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32001,
          message: `Unauthorized: ${message}`,
        },
        id: null,
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "WWW-Authenticate": 'Bearer realm="MCP API"',
        },
      }
    ),
    requestOrigin
  );
}

/**
 * Create a forbidden response (insufficient scope)
 */
function createForbiddenResponse(
  message: string,
  requestOrigin: string | null
): Response {
  return addCorsHeaders(
    new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32003,
          message: `Forbidden: ${message}`,
        },
        id: null,
      }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      }
    ),
    requestOrigin
  );
}

/**
 * Validate OAuth JWT token.
 * Returns auth info if valid, null if no OAuth configured, or error Response if invalid.
 */
async function validateOAuth(
  request: Request,
  env: Env,
  requestOrigin: string | null
): Promise<{ authInfo: OAuthAuthInfo | null } | { error: Response }> {
  const oauthConfig = getOAuthConfig(env);
  if (!oauthConfig) {
    return { authInfo: null }; // No OAuth configured
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    // No Bearer token provided
    if (oauthConfig.required !== false) {
      return {
        error: createUnauthorizedResponse("Missing Bearer token", requestOrigin),
      };
    }
    return { authInfo: null };
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verifyJWT(token, {
      issuer: oauthConfig.issuer,
      audience: oauthConfig.audience,
      jwksUri: oauthConfig.jwksUri,
    });

    // Check required scopes
    const tokenScopes = (payload.scope as string)?.split(" ") || [];
    if (oauthConfig.requiredScopes?.length) {
      const hasRequiredScopes = oauthConfig.requiredScopes.every((s) =>
        tokenScopes.includes(s)
      );
      if (!hasRequiredScopes) {
        return {
          error: createForbiddenResponse(
            `Insufficient scope. Required: ${oauthConfig.requiredScopes.join(", ")}`,
            requestOrigin
          ),
        };
      }
    }

    // Build OAuthAuthInfo
    const authInfo: OAuthAuthInfo = {
      token,
      clientId: ((payload.azp || payload.client_id || payload.sub) as string) || "unknown",
      scopes: tokenScopes,
      expiresAt: payload.exp,
      extra: {
        sub: payload.sub,
        email: payload.email as string | undefined,
        name: payload.name as string | undefined,
        ...payload,
      },
    };

    return { authInfo };
  } catch (error) {
    if (error instanceof JWTVerificationError) {
      log(`JWT verification failed: ${error.code} - ${error.message}`);
      return {
        error: createUnauthorizedResponse(error.message, requestOrigin),
      };
    }

    // Handle jose not installed
    if (
      error instanceof Error &&
      error.name === "JoseNotInstalledError"
    ) {
      console.error("[Cloudflare-MCP]", error.message);
      return {
        error: addCorsHeaders(
          new Response(
            JSON.stringify({
              jsonrpc: "2.0",
              error: {
                code: -32603,
                message: "OAuth is configured but jose library is not installed",
              },
              id: null,
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          ),
          requestOrigin
        ),
      };
    }

    log("JWT verification failed:", error);
    return {
      error: createUnauthorizedResponse("Invalid token", requestOrigin),
    };
  }
}

/**
 * Validate API key from Authorization header.
 * Returns auth info if valid, null if no API key configured, or an error Response if invalid.
 */
function validateApiKey(
  request: Request,
  env: Env,
  requestOrigin: string | null
): { authInfo: AuthInfo | null } | { error: Response } {
  // If no API key is configured, allow all requests (no auth required)
  if (!env.MCP_API_KEY) {
    return { authInfo: null };
  }

  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return {
      error: createUnauthorizedResponse(
        "Missing Authorization header",
        requestOrigin
      ),
    };
  }

  // Support "Bearer <token>" format
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  if (token !== env.MCP_API_KEY) {
    log("Invalid API key provided");
    return {
      error: createUnauthorizedResponse("Invalid API key", requestOrigin),
    };
  }

  // Valid API key
  return {
    authInfo: {
      token,
      clientId: "api-key",
      scopes: ["mcp:access"],
    },
  };
}

/**
 * Handle OAuth Protected Resource Metadata endpoint (RFC 9728).
 * Returns metadata describing how to authenticate with this resource.
 */
function handleProtectedResourceMetadata(
  request: Request,
  env: Env,
  requestOrigin: string | null
): Response {
  const oauthConfig = getOAuthConfig(env);

  if (!oauthConfig) {
    return addCorsHeaders(
      new Response(
        JSON.stringify({
          error: "OAuth not configured",
          hint: "Set MCP_OAUTH_ISSUER and MCP_OAUTH_AUDIENCE environment variables",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      ),
      requestOrigin
    );
  }

  const baseUrl = new URL(request.url).origin;

  const metadata: OAuthProtectedResourceMetadata = {
    resource: baseUrl,
    authorization_servers: oauthConfig.authorizationServers,
    bearer_methods_supported: ["header"],
    ...(oauthConfig.requiredScopes?.length && {
      scopes_supported: oauthConfig.requiredScopes,
    }),
  };

  return addCorsHeaders(
    new Response(JSON.stringify(metadata, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    }),
    requestOrigin
  );
}

/**
 * Add CORS headers to a Response
 */
function addCorsHeaders(
  response: Response,
  requestOrigin: string | null
): Response {
  const headers = new Headers(response.headers);

  // Determine the origin to use
  const origin =
    corsOrigin === "*" ? "*" : corsOrigin || requestOrigin || "*";

  headers.set("Access-Control-Allow-Origin", origin);
  headers.set(
    "Access-Control-Allow-Methods",
    corsMethods || "GET, POST, OPTIONS"
  );
  headers.set(
    "Access-Control-Allow-Headers",
    corsAllowedHeaders || "Content-Type, Authorization, Accept, mcp-session-id"
  );

  if (corsExposedHeaders) {
    headers.set("Access-Control-Expose-Headers", corsExposedHeaders);
  }

  if (corsCredentials) {
    headers.set("Access-Control-Allow-Credentials", "true");
  }

  if (corsMaxAge) {
    headers.set("Access-Control-Max-Age", String(corsMaxAge));
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Handle CORS preflight requests
 */
function handleCorsPreflightRequest(requestOrigin: string | null): Response {
  const headers = new Headers();

  const origin =
    corsOrigin === "*" ? "*" : corsOrigin || requestOrigin || "*";

  headers.set("Access-Control-Allow-Origin", origin);
  headers.set(
    "Access-Control-Allow-Methods",
    corsMethods || "GET, POST, OPTIONS"
  );
  headers.set(
    "Access-Control-Allow-Headers",
    corsAllowedHeaders || "Content-Type, Authorization, Accept, mcp-session-id"
  );

  if (corsExposedHeaders) {
    headers.set("Access-Control-Expose-Headers", corsExposedHeaders);
  }

  if (corsCredentials) {
    headers.set("Access-Control-Allow-Credentials", "true");
  }

  if (corsMaxAge) {
    headers.set("Access-Control-Max-Age", String(corsMaxAge));
  }

  return new Response(null, {
    status: 204,
    headers,
  });
}

/**
 * Log a message if debug mode is enabled
 */
function log(message: string, ...args: any[]): void {
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
      // Auth priority: OAuth first, then API key
      // This allows both methods to coexist

      // 1. Try OAuth validation first (if configured)
      const oauthResult = await validateOAuth(request, env, requestOrigin);
      if ("error" in oauthResult) {
        // OAuth is configured and validation failed
        return oauthResult.error;
      }

      if (oauthResult.authInfo) {
        // OAuth token validated successfully
        return handleMcpRequest(request, requestOrigin, oauthResult.authInfo);
      }

      // 2. No OAuth token provided (or OAuth not configured), try API key
      const apiKeyResult = validateApiKey(request, env, requestOrigin);
      if ("error" in apiKeyResult) {
        return apiKeyResult.error;
      }

      // Either API key validated or no auth configured
      return handleMcpRequest(request, requestOrigin, apiKeyResult.authInfo);
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
