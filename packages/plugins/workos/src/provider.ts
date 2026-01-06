import {
  Router,
  Request,
  Response,
  NextFunction,
  type RequestHandler,
} from "express";
import { Middleware } from "xmcp";
import { workosSessionContextProvider, workosClientContextProvider, setWorkOSSessionContext, setWorkOSClientContext, workosSessionContext } from "./context.js";
import type { WorkOSConfig, OAuthProtectedResourceMetadata, OAuthAuthorizationServerMetadata } from "./types.js";
import { verifyWorkOSToken, claimsToSession, extractBearerToken } from "./jwt.js";
import { getAuthKitBaseUrl } from "./utils.js";
import { WorkOS } from "@workos-inc/node";

export function workosProvider(config: WorkOSConfig): Middleware {
  if (!config.apiKey) {
    throw new Error("[WorkOS] Missing required config: apiKey");
  }
  if (!config.clientId) {
    throw new Error("[WorkOS] Missing required config: clientId");
  }
  if (!config.baseURL) {
    throw new Error("[WorkOS] Missing required config: baseURL");
  }
  if (!config.authkitDomain) {
    throw new Error("[WorkOS] Missing required config: authkitDomain");
  }


  workosClientContextProvider({
    workos: new WorkOS(config.apiKey, { clientId: config.clientId }),
  }, () => {

  });

  workosSessionContextProvider(
    {
      session: null
    },
    () => {}
  );

  

  return {
    middleware: workosMiddleware(config),
    router: workosRouter(config),
  };
}

function workosRouter(config: WorkOSConfig): Router {
  const router = Router();

  router.get(
    "/.well-known/oauth-protected-resource",
    (_req: Request, res: Response) => {
      const baseUrl = config.baseURL.replace(/\/$/, "");
      const authkitUrl = getAuthKitBaseUrl(config.authkitDomain);

      const metadata: OAuthProtectedResourceMetadata = {
        resource: baseUrl,
        authorization_servers: [authkitUrl],
        bearer_methods_supported: ["header"],
        ...(config.docsURL && { resource_documentation: config.docsURL }),
      };

      res.json(metadata);
    }
  );

  router.get(
    "/.well-known/oauth-authorization-server",
    async (_req: Request, res: Response) => {
      try {
        const authkitMetadataUrl = `${getAuthKitBaseUrl(config.authkitDomain)}/.well-known/openid-configuration`;
        const response = await fetch(authkitMetadataUrl);

        if (response.ok) {
          const data = await response.json();
          res.json(data);
          return;
        }

        // Fallback
        const authkitUrl = getAuthKitBaseUrl(config.authkitDomain);
        const metadata: OAuthAuthorizationServerMetadata = {
          issuer: authkitUrl,
          authorization_endpoint: `${authkitUrl}/oauth2/authorize`,
          token_endpoint: `${authkitUrl}/oauth2/token`,
          jwks_uri: `${authkitUrl}/oauth2/jwks`,
          response_types_supported: ["code"],
          grant_types_supported: ["authorization_code", "refresh_token"],
          code_challenge_methods_supported: ["S256"],
          token_endpoint_auth_methods_supported: ["none", "client_secret_post"],
          scopes_supported: ["openid", "profile", "email", "offline_access"],
        };
        res.json(metadata);
      } catch (error) {
        console.error("[WorkOS] Failed to fetch OAuth metadata:", error);
        res.status(500).json({ error: "Failed to get OAuth configuration" });
      }
    }
  );

  return router;
}

function workosMiddleware(config: WorkOSConfig): RequestHandler {
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

      const result = await verifyWorkOSToken(token, config.authkitDomain);

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

      setWorkOSSessionContext({
        session,
      });
      next();
    } catch (error) {
      console.error("[WorkOS] Authentication error:", error);
      res.setHeader(
        "WWW-Authenticate",
        `Bearer resource_metadata="/.well-known/oauth-protected-resource", error="invalid_token"`
      );
      res.status(401).json({
        error: "server_error",
        error_description: "Authentication processing failed",
      });
      next();
    }
  };
}
