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
} from "./types.js";
import {
  verifyScalekitToken,
  claimsToSession,
  extractBearerToken,
} from "./jwt.js";
import { Scalekit } from "@scalekit-sdk/node";
import { createRemoteJWKSet, type JWTVerifyGetKey } from "jose";

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

// The set of `iss` values a valid access token may carry. Scalekit is migrating
// this claim from the bare environment URL to a resource-scoped issuer, and both
// forms are valid during the rollout — so we accept the bare URL plus, when a
// resource is configured, its resource-scoped form. Derived entirely from the
// existing config; nothing extra to configure. Intentionally broader than
// getAuthServerBase, which must stay a single value for the OAuth AS metadata
// (RFC 9728 / RFC 8414).
function getExpectedIssuers(config: Config): readonly string[] {
  const envUrl = config.environmentUrl.replace(/\/$/, "");
  const issuers = new Set<string>([envUrl]);

  if (config.resourceId) {
    issuers.add(`${envUrl}/resources/${config.resourceId}`);
  }

  return [...issuers];
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

  // Note: the authorization server metadata (RFC 8414) is served by Scalekit,
  // not proxied here. Clients follow `authorization_servers` from the protected
  // resource metadata above to Scalekit's own /.well-known endpoint.

  return router;
}

function scalekitMiddleware(config: Config): RequestHandler {
  const expectedIssuers = getExpectedIssuers(config);

  // Discover the JWKS via the authorization server metadata (RFC 8414). For a
  // resource-scoped issuer (`${env}/resources/<id>`) the metadata lives at
  // `${env}/.well-known/oauth-authorization-server/resources/<id>` — the
  // well-known segment is inserted after the origin, per RFC 8414 — and its
  // `jwks_uri` points at the environment key set (`${env}/keys`). Resource-scoped
  // access tokens are signed with those same environment keys. Fall back to
  // `${env}/keys` if the metadata is unavailable.
  const jwksBase = config.environmentUrl.replace(/\/$/, "");
  const resourcePath = config.resourceId
    ? `/resources/${config.resourceId}`
    : "";
  const asMetadataUrl = `${jwksBase}/.well-known/oauth-authorization-server${resourcePath}`;

  // Resolve the JWKS once and cache the remote key set for the lifetime of the
  // middleware. createRemoteJWKSet maintains its own key cache, so building it
  // per request would defeat that and refetch the JWKS on every verification.
  let jwks: Promise<JWTVerifyGetKey> | null = null;
  const getJwks = (): Promise<JWTVerifyGetKey> => {
    if (!jwks) {
      jwks = (async () => {
        let jwksUri = new URL(`${jwksBase}/keys`);
        try {
          const response = await fetch(asMetadataUrl);
          if (response.ok) {
            const metadata = (await response.json()) as { jwks_uri?: string };
            if (metadata.jwks_uri) {
              jwksUri = new URL(metadata.jwks_uri);
            }
          }
        } catch {
          // Fall back to the constructed key set URL
        }
        return createRemoteJWKSet(jwksUri);
      })().catch((error) => {
        // Don't cache a rejected promise, otherwise a transient discovery
        // error would wedge the middleware for its whole lifetime.
        jwks = null;
        throw error;
      });
    }
    return jwks;
  };

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

      const keySet = await getJwks();
      const audience =
        config.resourceId || config.baseURL.replace(/\/$/, "");

      const result = await verifyScalekitToken(
        token,
        keySet,
        expectedIssuers,
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