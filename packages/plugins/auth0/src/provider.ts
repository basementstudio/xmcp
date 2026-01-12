import {
  Router,
  Request,
  Response,
  NextFunction,
  type RequestHandler,
} from "express";
import type { Middleware } from "xmcp";
import { contextProviderAuth, contextProviderConfig, getAuthContext } from "./context.js";
import { getAuthInfo } from "./session.js";
import type { Auth0Config, AuthInfo, OAuthProtectedResourceMetadata, OAuthAuthorizationServerMetadata } from "./types.js";
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

  contextProviderAuth({ authInfo: null }, () => {});
  contextProviderConfig({ config }, () => {});

  return {
    middleware: auth0Middleware(config),
    router: auth0Router(config),
  };
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
            error_description: "Access token has expired. Please refresh your token.",
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

function hasAllScopes(
  requiredScopes: readonly string[],
  userScopes: readonly string[]
): boolean {
  return requiredScopes.every((scope) => userScopes.includes(scope));
}

/**
 * Wraps a tool handler to enforce required OAuth scopes.
 *
 * @example
 * ```typescript
 * export default requireScopes(async (params) => {
 *   const authInfo = getAuthInfo();
 *   return `Hello ${authInfo.extra.name}!`;
 * });
 * ```
 */
export function requireScopes<TParams, TReturn>(
  toolFunction: (params: TParams) => Promise<TReturn>
): (params: TParams) => Promise<TReturn>;
export function requireScopes<TParams, TReturn>(
  requiredScopes: readonly string[],
  toolFunction: (params: TParams) => Promise<TReturn>
): (params: TParams) => Promise<TReturn>;
export function requireScopes<TParams, TReturn>(
  requiredScopesOrHandler: readonly string[] | ((params: TParams) => Promise<TReturn>),
  maybeHandler?: (params: TParams) => Promise<TReturn>
): (params: TParams) => Promise<TReturn> {
  const requiredScopes =
    Array.isArray(requiredScopesOrHandler) ? requiredScopesOrHandler : inferScopeFromCaller();
  const toolFunction =
    typeof requiredScopesOrHandler === "function" ? requiredScopesOrHandler : maybeHandler;

  if (!toolFunction) {
    throw new Error("[Auth0] requireScopes: tool handler is missing");
  }

  if (!requiredScopes || requiredScopes.length === 0) {
    throw new Error(
      "[Auth0] requireScopes: could not infer scope. Pass explicit scopes or ensure this helper is called directly from a tool module."
    );
  }

  return async (params: TParams): Promise<TReturn> => {
    const authCtx = getAuthContext();

    if (!authCtx.authInfo) {
      throw new InvalidTokenError(
        "Auth info not available. Ensure this is called within a protected route."
      );
    }

    const authInfo = getAuthInfo();
    const userScopes = authInfo.scopes;
    if (!hasAllScopes(requiredScopes, userScopes)) {
      const missing = requiredScopes.filter((scope) => !userScopes.includes(scope));
      throw new InsufficientScopeError(`Missing required scopes: ${missing.join(", ")}`);
    }

    return toolFunction(params);
  };
}

function inferScopeFromCaller(): readonly string[] | null {
  const stack = new Error().stack;
  if (!stack) return null;

  const lines = stack.split("\n").slice(2);
  for (const line of lines) {
    const match = line.match(/(?:file:\/\/)?(\/[^):]+):\d+:\d+/);
    if (!match || !match[1]) continue;
    const filePath = match[1];
    const base = filePath.split("/").pop();
    if (!base) continue;
    const withoutExt = base.replace(/\.[^.]+$/, "");
    if (!withoutExt) continue;
    return [`tool:${withoutExt}`];
  }

  return null;
}
