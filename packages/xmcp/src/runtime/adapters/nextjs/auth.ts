import type { AuthInfo } from "@socotra/modelcontextprotocol-sdk/server/auth/types";

/**
 * Standard OAuth Protected Resource Metadata path (RFC 9728)
 */
const RESOURCE_METADATA_PATH = "/.well-known/oauth-protected-resource";

/**
 * OAuth error codes (MCP-specific)
 */
const AUTH_ERROR_CODES = {
  INVALID_TOKEN: -32001,
  INSUFFICIENT_SCOPE: -32002,
} as const;

/**
 * CORS headers for OAuth Protected Resource Metadata endpoint.
 * Configured to allow any origin to make the endpoint accessible to web-based MCP clients.
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Max-Age": "86400",
};

/**
 * OAuth Protected Resource Metadata interface (RFC 9728).
 */
export interface OAuthProtectedResourceMetadata {
  resource: string;
  authorization_servers: string[];
  bearer_methods_supported?: string[];
  resource_documentation?: string;
  introspection_endpoint?: string;
  revocation_endpoint?: string;
  [key: string]: unknown;
}

// Types
export type VerifyToken = (
  req: Request,
  bearerToken?: string
) => Promise<
  | {
      token: string;
      clientId: string;
      scopes: string[];
      expiresAt?: number;
      resource?: URL;
      extra?: Record<string, unknown>;
    }
  | undefined
>;

export type AuthConfig = {
  verifyToken: VerifyToken;
  required?: boolean;
  requiredScopes?: string[];
};

// Extend Request interface to include auth property
declare global {
  interface Request {
    auth?: AuthInfo;
  }
}

/**
 * Extracts bearer token from Authorization header
 */
function extractBearerToken(req: Request): string | undefined {
  const authHeader = req.headers.get("Authorization");
  const [type, token] = authHeader?.split(" ") || [];
  return type?.toLowerCase() === "bearer" ? token : undefined;
}

/**
 * Creates an OAuth authentication error response
 */
function createAuthErrorResponse(
  req: Request,
  errorCode: string,
  errorDescription: string,
  httpStatus: number,
  rpcCode: number
): Response {
  const origin = new URL(req.url).origin;
  const resourceMetadataUrl = `${origin}${RESOURCE_METADATA_PATH}`;

  return new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: rpcCode,
        message: errorDescription,
      },
      id: null,
    }),
    {
      status: httpStatus,
      headers: {
        "WWW-Authenticate": `Bearer error="${errorCode}", error_description="${errorDescription}", resource_metadata="${resourceMetadataUrl}"`,
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Validates that token has not expired
 */
function isTokenExpired(authInfo: AuthInfo): boolean {
  return (
    authInfo.expiresAt !== undefined && authInfo.expiresAt < Date.now() / 1000
  );
}

/**
 * Validates that token has all required scopes
 */
function hasRequiredScopes(
  authInfo: AuthInfo,
  requiredScopes: string[]
): boolean {
  return requiredScopes.every((scope) => authInfo.scopes.includes(scope));
}

/**
 * Wraps an MCP handler with OAuth 2.0 Bearer token authentication.
 * Extracts the bearer token from the Authorization header, verifies it,
 * and sets it on the request object for use by the handler.
 */
export function withAuth(
  handler: (request: Request) => Promise<Response>,
  config: AuthConfig
): (request: Request) => Promise<Response> {
  return async (req: Request) => {
    const { verifyToken, required = false, requiredScopes } = config;

    // Extract bearer token
    const bearerToken = extractBearerToken(req);

    // Verify token
    let authInfo: AuthInfo | undefined;
    try {
      authInfo = await verifyToken(req, bearerToken);
    } catch (error) {
      console.error("[MCP Auth] Error verifying token:", error);
      return createAuthErrorResponse(
        req,
        "invalid_token",
        "Invalid token",
        401,
        AUTH_ERROR_CODES.INVALID_TOKEN
      );
    }

    // Check if authentication is required but not provided
    if (required && !authInfo) {
      return createAuthErrorResponse(
        req,
        "invalid_token",
        "No authorization provided",
        401,
        AUTH_ERROR_CODES.INVALID_TOKEN
      );
    }

    // If no auth info, proceed without it
    if (!authInfo) {
      return handler(req);
    }

    // Validate token expiration
    if (isTokenExpired(authInfo)) {
      return createAuthErrorResponse(
        req,
        "invalid_token",
        "Token has expired",
        401,
        AUTH_ERROR_CODES.INVALID_TOKEN
      );
    }

    // Validate required scopes
    if (
      requiredScopes?.length &&
      !hasRequiredScopes(authInfo, requiredScopes)
    ) {
      return createAuthErrorResponse(
        req,
        "insufficient_scope",
        "Insufficient scope",
        403,
        AUTH_ERROR_CODES.INSUFFICIENT_SCOPE
      );
    }

    // Set auth info on the request object
    req.auth = authInfo;

    // Call the handler with authenticated request
    return handler(req);
  };
}

/**
 * Extracts the base resource URL from a well-known endpoint request
 */
function extractResourceUrl(req: Request): string {
  const resourceUrl = new URL(req.url);

  // Remove the well-known path to get the base resource URL
  resourceUrl.pathname = resourceUrl.pathname.replace(
    /^\/\.well-known\/[^\/]+/,
    ""
  );

  // The URL class replaces empty pathname with "/", so we correct that
  return resourceUrl.pathname === "/"
    ? resourceUrl.toString().replace(/\/$/, "")
    : resourceUrl.toString();
}

/**
 * OAuth 2.0 Protected Resource Metadata endpoint handler (RFC 9728).
 * Returns a handler that serves protected resource metadata at `/.well-known/oauth-protected-resource`.
 *
 * @param options - Configuration options
 * @param options.authorizationServers - Array of issuer URLs of the OAuth 2.0 Authorization Servers
 * @returns A handler function that can be exported as GET in Next.js route handlers
 */
export function resourceMetadataHandler(options: {
  authorizationServers: string[];
}): (req: Request) => Response {
  return (req: Request) => {
    const resource = extractResourceUrl(req);
    const metadata: OAuthProtectedResourceMetadata = {
      resource,
      authorization_servers: options.authorizationServers,
    };

    return new Response(JSON.stringify(metadata), {
      headers: {
        ...corsHeaders,
        "Cache-Control": "max-age=3600",
        "Content-Type": "application/json",
      },
    });
  };
}

/**
 * CORS OPTIONS request handler for OAuth metadata endpoints.
 * Necessary for MCP clients that operate in web browsers.
 *
 * @returns A handler function that can be exported as OPTIONS in Next.js route handlers
 */
export function resourceMetadataOptions(req: Request): Response {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}
