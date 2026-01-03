import {
  Router,
  Request,
  Response,
  NextFunction,
  type RequestHandler,
} from "express";
import { Middleware } from "xmcp";
import { workosContextProvider } from "./context.js";
import { initWorkOS } from "./client.js";
import type {
  WorkOSConfig,
  OAuthProtectedResourceMetadata,
  OAuthAuthorizationServerMetadata,
} from "./types.js";
import {
  verifyWorkOSToken,
  claimsToSession,
  extractBearerToken,
} from "./jwt.js";
import { getWorkOSClient } from "./client.js";
import {
  getAuthKitBaseUrl,
  getOpenIdConfigUrl,
  getAuthorizeUrl,
  getTokenUrl,
  getJwksUrl,
} from "./utils.js";

export function workosProvider(config: WorkOSConfig): Middleware {
  initWorkOS(config.apiKey, config.clientId);

  return {
    middleware: workosMiddleware(config),
    router: workosRouter(config),
  };
}

function workosRouter(config: WorkOSConfig): Router {
  const router = Router();

  router.use((req: Request, _res: Response, next: NextFunction) => {
    workosContextProvider(
      {
        session: null,
        headers: req.headers,
      },
      () => {
        next();
      }
    );
  });

  // RFC 8707
  router.get(
    "/.well-known/oauth-protected-resource",
    (_req: Request, res: Response) => {
      const metadata: OAuthProtectedResourceMetadata = {
        resource: config.baseURL,
        authorization_servers: [getAuthKitBaseUrl(config.authkitDomain)],
        bearer_methods_supported: ["header"],
        resource_documentation: `${config.baseURL}/docs`,
      };

      res.json(metadata);
    }
  );

  router.get(
    "/.well-known/oauth-authorization-server",
    async (_req: Request, res: Response) => {
      try {
        const authkitMetadataUrl = getOpenIdConfigUrl(config.authkitDomain);
        const response = await fetch(authkitMetadataUrl);

        if (!response.ok) {
          const metadata: OAuthAuthorizationServerMetadata = {
            issuer: getAuthKitBaseUrl(config.authkitDomain),
            authorization_endpoint: getAuthorizeUrl(config.authkitDomain),
            token_endpoint: getTokenUrl(config.authkitDomain),
            jwks_uri: getJwksUrl(config.authkitDomain),
            response_types_supported: ["code"],
            grant_types_supported: ["authorization_code", "refresh_token"],
            code_challenge_methods_supported: ["S256"],
            token_endpoint_auth_methods_supported: ["client_secret_post"],
          };
          res.json(metadata);
          return;
        }

        const data = await response.json();
        res.json(data);
      } catch (error) {
        console.error("[WorkOS] Failed to fetch OAuth metadata:", error);
        res.status(500).json({ error: "Failed to get OAuth configuration" });
      }
    }
  );

  router.get("/auth/callback", async (req: Request, res: Response) => {
    const { code, error, error_description } = req.query;

    if (error) {
      res.status(400).json({
        error: error as string,
        error_description: error_description as string,
      });
      return;
    }

    if (!code || typeof code !== "string") {
      res.status(400).json({
        error: "invalid_request",
        error_description: "Missing authorization code",
      });
      return;
    }

    try {
      const workos = getWorkOSClient();
      const authResult = await workos.userManagement.authenticateWithCode({
        clientId: config.clientId,
        code,
      });

      res.json({
        success: true,
        user: authResult.user,
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken,
      });
    } catch (err) {
      console.error("[WorkOS] Code exchange failed:", err);
      res.status(401).json({
        error: "authentication_failed",
        error_description:
          err instanceof Error ? err.message : "Code exchange failed",
      });
    }
  });

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

      const claims = await verifyWorkOSToken(token, config.authkitDomain);

      if (!claims) {
        res.setHeader(
          "WWW-Authenticate",
          `Bearer resource_metadata="/.well-known/oauth-protected-resource", error="invalid_token"`
        );
        res.status(401).json({
          error: "invalid_token",
          error_description: "Token verification failed",
        });
        return;
      }

      const session = claimsToSession(claims);

      workosContextProvider(
        {
          session,
          headers: req.headers,
        },
        () => {
          next();
        }
      );
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
    }
  };
}
