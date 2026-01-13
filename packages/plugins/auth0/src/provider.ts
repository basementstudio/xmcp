import {
  Router,
  Request,
  Response,
  NextFunction,
  type RequestHandler,
} from "express";
import type { Middleware } from "xmcp";
import { ApiClient } from "@auth0/auth0-api-js";
import { ManagementClient } from "auth0";
import {
  contextProviderAuth,
  contextProviderConfig,
  contextProviderApiClient,
  contextProviderManagementClient,
  getAuthContext,
  getManagementClientContext,
} from "./context.js";
import { getAuthInfo } from "./session.js";
import { fetchApiPermissions } from "./permissions.js";
import type {
  Auth0Config,
  AuthInfo,
  OAuthProtectedResourceMetadata,
  OAuthAuthorizationServerMetadata,
} from "./types.js";
import { createVerifier, extractBearerToken } from "./jwt.js";

const DEFAULT_SCOPES = ["openid", "profile", "email"] as const;

/**
 * Creates an Auth0 authentication provider for xmcp.
 *
 * @example
 * ```typescript
 * import { auth0Provider } from "@xmcp-dev/auth0";
 *
 * export default auth0Provider({
 *   domain: process.env.AUTH0_DOMAIN!,
 *   audience: process.env.AUTH0_AUDIENCE!,
 *   baseURL: process.env.BASE_URL!,
 *   scopesSupported: ["tool:greet", "tool:whoami"],
 * });
 * ```
 */
export function auth0Provider(config: Auth0Config): Middleware {
  if (!config.domain) {
    throw new Error("[Auth0] Missing required config: domain");
  }
  if (!config.audience) {
    throw new Error("[Auth0] Missing required config: audience");
  }
  if (!config.baseURL) {
    throw new Error("[Auth0] Missing required config: baseURL");
  }

  // Create Auth0 API client with optional client credentials for Token Vault
  const apiClient = new ApiClient({
    domain: config.domain,
    audience: config.audience,
    // Pass client credentials if management config exists (required for Token Vault)
    ...(config.management && {
      clientId: config.management.clientId,
      clientSecret: config.management.clientSecret,
    }),
  });

  // Create Management client (only if configured)
  const managementClient = config.management
    ? createManagementClient(config)
    : null;

  // Initialize context providers with default values.
  // These establish the context shape; actual values are set during request processing.
  contextProviderAuth({ authInfo: null }, () => {});
  contextProviderConfig({ config }, () => {});
  contextProviderApiClient({ apiClient }, () => {});
  contextProviderManagementClient({ managementClient }, () => {});

  return {
    middleware: auth0Middleware(config),
    router: auth0Router(config),
  };
}

function createManagementClient(config: Auth0Config): ManagementClient {
  return new ManagementClient({
    domain: config.domain,
    clientId: config.management!.clientId,
    clientSecret: config.management!.clientSecret,
  });
}

function auth0Router(config: Auth0Config): Router {
  const router = Router();
  const baseUrl = config.baseURL.replace(/\/$/, "");
  const auth0Url = `https://${config.domain}`;

  const scopes = config.scopesSupported
    ? [...DEFAULT_SCOPES, ...config.scopesSupported]
    : [...DEFAULT_SCOPES];

  router.get(
    "/.well-known/oauth-protected-resource",
    (_req: Request, res: Response) => {
      const metadata: OAuthProtectedResourceMetadata = {
        resource: baseUrl,
        authorization_servers: [auth0Url],
        bearer_methods_supported: ["header"],
        scopes_supported: scopes,
      };

      res.json(metadata);
    }
  );

  router.get(
    "/.well-known/oauth-authorization-server",
    async (_req: Request, res: Response) => {
      try {
        const auth0MetadataUrl = `${auth0Url}/.well-known/openid-configuration`;
        const response = await fetch(auth0MetadataUrl);

        if (response.ok) {
          const data = await response.json();
          res.json(data);
          return;
        }

        const metadata: OAuthAuthorizationServerMetadata = {
          issuer: `${auth0Url}/`,
          authorization_endpoint: `${auth0Url}/authorize`,
          token_endpoint: `${auth0Url}/oauth/token`,
          jwks_uri: `${auth0Url}/.well-known/jwks.json`,
          response_types_supported: ["code"],
          grant_types_supported: ["authorization_code", "refresh_token"],
          code_challenge_methods_supported: ["S256"],
          token_endpoint_auth_methods_supported: ["none", "client_secret_post"],
          scopes_supported: scopes,
        };
        res.json(metadata);
      } catch (error) {
        console.error("[Auth0] Failed to fetch OAuth metadata:", error);
        res.status(500).json({ error: "Failed to get OAuth configuration" });
      }
    }
  );

  return router;
}

function auth0Middleware(config: Auth0Config): RequestHandler {
  const verify = createVerifier(config);

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.path.startsWith("/mcp")) {
      next();
      return;
    }

    try {
      const token = extractBearerToken(req.headers.authorization);

      if (!token) {
        res.setHeader(
          "WWW-Authenticate",
          `Bearer resource_metadata="/.well-known/oauth-protected-resource"`
        );
        res.status(401).json({
          error: "unauthorized",
          error_description: "Missing or invalid bearer token",
        });
        return;
      }

      const result = await verify(token);

      if (!result.ok) {
        if (result.error === "expired") {
          res.setHeader(
            "WWW-Authenticate",
            `Bearer resource_metadata="/.well-known/oauth-protected-resource", error="invalid_token", error_description="Token has expired"`
          );
          res.status(401).json({
            error: "token_expired",
            error_description:
              "Access token has expired. Please refresh your token.",
          });
        } else {
          res.setHeader(
            "WWW-Authenticate",
            `Bearer resource_metadata="/.well-known/oauth-protected-resource", error="invalid_token"`
          );
          res.status(401).json({
            error: "invalid_token",
            error_description: result.message,
          });
        }
        return;
      }

      try {
        await enforceToolPermissions(req, res, config, result.authInfo);
      } catch (error) {
        if (!res.headersSent) {
          const message = error instanceof Error ? error.message : "Forbidden";

          // Extract request ID from the JSON-RPC request body
          const requestId = req.body?.id ?? null;

          // Return as MCP tool result (HTTP 200)
          res.status(200).json({
            jsonrpc: "2.0",
            id: requestId,
            result: {
              content: [
                {
                  type: "text",
                  text: message,
                },
              ],
            },
          });
        }
        return;
      }
      contextProviderAuth({ authInfo: result.authInfo }, () => {
        next();
      });
    } catch (error) {
      console.error("[Auth0] Authentication error:", error);
      res.setHeader(
        "WWW-Authenticate",
        `Bearer resource_metadata="/.well-known/oauth-protected-resource", error="invalid_token"`
      );
      res.status(401).json({
        error: "server_error",
        error_description: "Authentication processing failed",
      });
    }
  };
}

async function enforceToolPermissions(
  req: Request,
  res: Response,
  config: Auth0Config,
  authInfo: AuthInfo
): Promise<void> {
  // Extract tool name from request body (MCP JSON-RPC message)
  let toolName: string | undefined;

  // Try to extract from req.body directly since xmcp hasn't set headers/global yet
  if (req.body && typeof req.body === "object") {
    const messages = Array.isArray(req.body) ? req.body : [req.body];
    for (const message of messages) {
      if (
        message?.method === "tools/call" &&
        message?.params &&
        typeof message.params === "object" &&
        "name" in message.params &&
        typeof message.params.name === "string"
      ) {
        toolName = message.params.name;
        break;
      }
    }
  }

  // Fallback to headers/global (for compatibility if xmcp sets them)
  if (!toolName) {
    const toolNameHeader = req.headers["x-mcp-tool-name"];
    toolName =
      typeof toolNameHeader === "string"
        ? toolNameHeader
        : Array.isArray(toolNameHeader)
          ? toolNameHeader[0]
          : (global as any).__XMCP_CURRENT_TOOL_NAME;
  }

  if (!toolName || typeof toolName !== "string" || toolName.length === 0) {
    return; // No tool context; allow
  }

  const requiredScope = `tool:${toolName}`;
  const userScopes = new Set([
    ...authInfo.scopes,
    ...(authInfo.permissions ?? []),
  ]);

  // Require Management API configuration for tool permission enforcement
  if (!config.management) {
    throw new Error(
      "[Auth0] Management API configuration is required for tool permission enforcement. " +
        "Please configure the 'management' option with clientId and clientSecret."
    );
  }

  // Get management client from context
  const { managementClient } = getManagementClientContext();

  let managementPermissions: readonly string[] = [];
  try {
    managementPermissions = await fetchApiPermissions(config, managementClient);
  } catch (error) {
    console.error(
      "[Auth0] Failed to fetch permissions from Management API:",
      error
    );
    // Re-throw the original error with its detailed message
    throw error;
  }

  const scopeExistsInAuth0 = managementPermissions.includes(requiredScope);
  const tokenHasScope = userScopes.has(requiredScope);

  if (scopeExistsInAuth0) {
    if (!tokenHasScope) {
      throw new InsufficientScopeError(
        `You don't have permission to use the '${toolName}' tool.`
      );
    }
    return;
  }

  // Scope not defined in Auth0 - allow as public tool
  if (tokenHasScope) {
    return;
  }

  return;
}

export class InsufficientScopeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsufficientScopeError";
  }
}

export class InvalidTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTokenError";
  }
}

