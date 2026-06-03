import {
  Router,
  Request,
  Response,
  NextFunction,
  type RequestHandler,
} from "express";
import type { Middleware } from "xmcp";
import { contextProviderSession, contextProviderClient } from "./context.js";
import type {
  Config,
  OAuthProtectedResourceMetadata,
  OAuthAuthorizationServerMetadata,
} from "./types.js";
import {
  verifyScalekitToken,
  claimsToSession,
  extractBearerToken,
} from "./jwt.js";
import { Scalekit } from "@scalekit-sdk/node";

export function scalekitProvider(config: Config): Middleware {
  if (!config.environmentUrl) {
    throw new Error("[Scalekit] Missing required config: environmentUrl");
  }
  if (!config.clientId) {
    throw new Error("[Scalekit] Missing required config: clientId");
  }
  if (!config.clientSecret) {
    throw new Error("[Scalekit] Missing required config: clientSecret");
  }
  if (!config.baseURL) {
    throw new Error("[Scalekit] Missing required config: baseURL");
  }

  contextProviderClient(
    {
      client: new Scalekit(
        config.environmentUrl,
        config.clientId,
        config.clientSecret
      ),
    },
    () => {}
  );

  contextProviderSession({ session: null }, () => {});

  return {
    middleware: scalekitMiddleware(config),
    router: scalekitRouter(config),
  };
}

function getAuthServerBase(config: Config): string {
  const envUrl = config.environmentUrl.replace(/\/$/, "");
  return config.resourceId ? `${envUrl}/resources/${config.resourceId}` : envUrl;
}

function scalekitRouter(config: Config): Router {
  const router = Router();
  const baseUrl = config.baseURL.replace(/\/$/, "");
  const authServerBase = getAuthServerBase(config);

  router.get(
    "/.well-known/oauth-protected-resource",
    (_req: Request, res: Response) => {
      const metadata: OAuthProtectedResourceMetadata = {
        resource: baseUrl,
        authorization_servers: [authServerBase],
        bearer_methods_supported: ["header"],
        ...(config.docsURL && { resource_documentation: config.docsURL }),
        ...(config.scopes &&
          config.scopes.length > 0 && { scopes_supported: [...config.scopes] }),
      };

      res.json(metadata);
    }
  );

  router.get(
    "/.well-known/oauth-authorization-server",
    async (_req: Request, res: Response) => {
      try {
        const oidcUrl = `${authServerBase}/.well-known/openid-configuration`;
        const response = await fetch(oidcUrl);

        if (response.ok) {
          const data = await response.json();
          res.json(data);
          return;
        }

        // Fallback
        const metadata: OAuthAuthorizationServerMetadata = {
          issuer: authServerBase,
          authorization_endpoint: `${authServerBase}/oauth/authorize`,
          token_endpoint: `${authServerBase}/oauth/token`,
          jwks_uri: `${authServerBase}/keys`,
          response_types_supported: ["code"],
          grant_types_supported: ["authorization_code", "refresh_token"],
          code_challenge_methods_supported: ["S256"],
          token_endpoint_auth_methods_supported: [
            "none",
            "client_secret_post",
          ],
          scopes_supported: ["openid", "profile", "email", "offline_access"],
        };
        res.json(metadata);
      } catch (error) {
        console.error("[Scalekit] Failed to fetch OAuth metadata:", error);
        res.status(500).json({ error: "Failed to get OAuth configuration" });
      }
    }
  );

  return router;
}

function scalekitMiddleware(config: Config): RequestHandler {
  const authServerBase = getAuthServerBase(config);

  // Pre-fetch JWKS URI from OIDC discovery
  let resolvedJwksUri: URL | null = null;
  (async () => {
    try {
      const oidcUrl = `${authServerBase}/.well-known/openid-configuration`;
      const response = await fetch(oidcUrl);
      if (response.ok) {
        const oidcConfig = (await response.json()) as { jwks_uri?: string };
        if (oidcConfig.jwks_uri) {
          resolvedJwksUri = new URL(oidcConfig.jwks_uri);
        }
      }
    } catch {
      // Will fall back to constructed URL at request time
    }
  })();

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

      const jwksUrl =
        resolvedJwksUri || new URL(`${authServerBase}/keys`);
      const audience =
        config.resourceId || config.baseURL.replace(/\/$/, "");

      const result = await verifyScalekitToken(
        token,
        jwksUrl,
        authServerBase,
        audience
      );

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
            error_description: "Token verification failed",
          });
        }
        return;
      }

      const session = claimsToSession(result.claims);

      contextProviderSession({ session }, () => {
        next();
      });
    } catch (error) {
      console.error("[Scalekit] Authentication error:", error);
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