import {
  Router,
  Request,
  Response,
  NextFunction,
  type RequestHandler,
} from "express";
import { extractToolNamesFromRequest, type Middleware } from "xmcp";
import { ApiClient } from "@auth0/auth0-api-js";
import { ManagementClient } from "auth0";
import { providerClientContext, providerSessionContext } from "./context.js";
import type {
  Config,
  AuthInfo,
  OAuthProtectedResourceMetadata,
  OAuthAuthorizationServerMetadata,
} from "./types.js";
import { createVerifier, extractBearerToken } from "./jwt.js";
import {
  fetchResourceServerScopes,
  fetchUserPermissions,
} from "./permissions.js";

const DEFAULT_SCOPES = ["openid", "profile", "email"] as const;

export function auth0Provider(config: Config): Middleware {
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
    clientId: config.clientId,
    clientSecret: config.clientSecret,
  });

  // Always create ManagementClient for permission checking
  const managementClient = createManagementClient(config);

  providerClientContext({ config, apiClient, managementClient }, () => {});
  providerSessionContext({ authInfo: null }, () => {});

  return {
    middleware: auth0Middleware(config, managementClient),
    router: auth0Router(config),
  };
}

function createManagementClient(config: Config): ManagementClient {
  return new ManagementClient({
    domain: config.domain,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    ...(config.management?.audience && {
      audience: config.management.audience,
    }),
    ...(config.management?.resourceServerIdentifier && {
      resourceServerIdentifier: config.management.resourceServerIdentifier,
    }),
  });
}

function auth0Router(config: Config): Router {
  const router = Router();
  const domainClean = config.domain
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
  const auth0Url = new URL(`https://${domainClean}`).href;

  const scopes = config.scopesSupported
    ? [...DEFAULT_SCOPES, ...config.scopesSupported]
    : [...DEFAULT_SCOPES];

  router.get(
    "/.well-known/oauth-protected-resource",
    (_req: Request, res: Response) => {
      const metadata: OAuthProtectedResourceMetadata = {
        resource: config.audience,
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
          issuer: `${auth0Url}`,
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

function auth0Middleware(
  config: Config,
  managementClient: ManagementClient
): RequestHandler {
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
        await enforceToolPermissions(
          req,
          config,
          result.authInfo,
          managementClient
        );
      } catch (error) {
        if (!res.headersSent) {
          const message = error instanceof Error ? error.message : "Forbidden";

          const requestId = findToolCallId(
            req,
            error instanceof ToolPermissionError ? error.toolName : undefined
          );

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
      providerSessionContext({ authInfo: result.authInfo }, () => {
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
  config: Config,
  authInfo: AuthInfo,
  managementClient: ManagementClient
): Promise<void> {
  const toolNames = [...new Set(extractToolNamesFromRequest(req))];

  if (toolNames.length === 0) {
    return;
  }

  const definedScopes = await fetchResourceServerScopes(
    managementClient,
    config.audience
  ).catch((error) => {
    console.error("[Auth0] Failed to fetch resource server scopes:", error);
    return null;
  });

  if (!definedScopes) {
    throw new ToolPermissionError(toolNames[0]);
  }

  const privateTools = toolNames.filter((name) =>
    definedScopes.has(toolScope(name))
  );

  if (privateTools.length === 0) {
    return;
  }

  const userPermissions = await fetchUserPermissions(
    managementClient,
    authInfo.user.sub,
    config.audience
  ).catch((error) => {
    console.error("[Auth0] Failed to fetch user permissions:", error);
    return null;
  });

  const deniedTool = privateTools.find(
    (name) => !userPermissions?.has(toolScope(name))
  );

  if (deniedTool) {
    throw new ToolPermissionError(deniedTool);
  }
}

function toolScope(toolName: string): string {
  return `tool:${toolName}`;
}

class ToolPermissionError extends Error {
  constructor(readonly toolName: string) {
    super(`You don't have permission to use the '${toolName}' tool.`);
  }
}

function findToolCallId(
  req: Request,
  toolName: string | undefined
): string | number | null {
  const messages: unknown[] = Array.isArray(req.body) ? req.body : [req.body];
  const message = messages.find(
    (candidate) =>
      isToolCall(candidate) &&
      (toolName === undefined || candidate.params?.name === toolName)
  );
  return isToolCall(message) ? (message.id ?? null) : null;
}

function isToolCall(message: unknown): message is {
  id?: string | number | null;
  params?: { name?: unknown };
} {
  return (
    typeof message === "object" &&
    message !== null &&
    (message as { method?: unknown }).method === "tools/call"
  );
}
