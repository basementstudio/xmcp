import {
  Router,
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from "express";
import type { Middleware } from "xmcp";
import { providerClientContext, providerSessionContext } from "./context.js";
import { createClerkClient } from "@clerk/express";
import type { config } from "./types.js";
import {
  verifyToken,
  claimsToSession,
  extractBearerToken,
  getIssuer,
} from "./jwt.js";
import type {
  OAuthProtectedResourceMetadata,
  OAuthAuthorizationServerMetadata,
} from "./types.js";

export function clerkProvider(config: config): Middleware {
  if (!config.secretKey) {
    throw new Error("[Clerk] Missing required config: secretKey");
  }
  if (!config.clerkDomain) {
    throw new Error("[Clerk] Missing required config: clerkDomain");
  }
  if (!config.baseURL) {
    throw new Error("[Clerk] Missing required config: baseURL");
  }

  providerClientContext({
    client: createClerkClient({ secretKey: config.secretKey }),
  }, () => {});

  return {
    middleware: clerkMiddleware(config),
    router: clerkRouter(config),
  };
}

function clerkRouter(config: config): Router {
  const router = Router();
  const clerkIssuer = getIssuer(config.clerkDomain);

  // RFC 9728
  router.get(
    "/.well-known/oauth-protected-resource",
    (_req: Request, res: Response) => {
      const baseUrl = config.baseURL.replace(/\/$/, "");

      const metadata: OAuthProtectedResourceMetadata = {
        resource: baseUrl,
        authorization_servers: [clerkIssuer],
        bearer_methods_supported: ["header"],
        scopes_supported: config.scopes ?? ["profile", "email"],
        ...(config.docsURL && { resource_documentation: config.docsURL }),
      };

      res.json(metadata);
    }
  );

  // RFC 8414
  router.get(
    "/.well-known/oauth-authorization-server",
    async (_req: Request, res: Response) => {
      try {
        const openIdConfigUrl = `${clerkIssuer}/.well-known/openid-configuration`;
        const response = await fetch(openIdConfigUrl);

        if (response.ok) {
          const data = await response.json();
          res.json(data);
          return;
        }

        const metadata: OAuthAuthorizationServerMetadata = {
          issuer: clerkIssuer,
          authorization_endpoint: `${clerkIssuer}/oauth/authorize`,
          token_endpoint: `${clerkIssuer}/oauth/token`,
          jwks_uri: `${clerkIssuer}/.well-known/jwks.json`,
          response_types_supported: ["code"],
          grant_types_supported: ["authorization_code", "refresh_token"],
          code_challenge_methods_supported: ["S256"],
          token_endpoint_auth_methods_supported: ["none", "client_secret_post"],
          scopes_supported: ["openid", "profile", "email", "offline_access"],
        };
        res.json(metadata);
      } catch (error) {
        console.error("[Clerk] Failed to fetch OAuth metadata:", error);
        res.status(500).json({ error: "Failed to get OAuth configuration" });
      }
    }
  );

  return router;
}

function clerkMiddleware(config: config): RequestHandler {
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

      const result = await verifyToken(token, config.secretKey);

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

      providerSessionContext({ session }, () => {
        next();
      });
    } catch (error) {
      console.error("[Clerk] Authentication error:", error);
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
