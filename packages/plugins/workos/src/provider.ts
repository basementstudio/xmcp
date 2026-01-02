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

/**
 * Create the WorkOS AuthKit provider middleware and router
 *
 * @param config - WorkOS configuration
 * @returns Middleware object with middleware and router
 */
export function workosProvider(config: WorkOSConfig): Middleware {
  // Initialize the WorkOS SDK client
  initWorkOS(config.apiKey, config.clientId);

  return {
    middleware: workosMiddleware(config),
    router: workosRouter(config),
  };
}

/**
 * Create the WorkOS router for OAuth metadata endpoints
 */
function workosRouter(config: WorkOSConfig): Router {
  const router = Router();

  // Wrap all routes with context provider
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

  /**
   * OAuth Protected Resource Metadata endpoint
   * Returns information about this resource server per RFC 8707
   */
  router.get(
    "/.well-known/oauth-protected-resource",
    (_req: Request, res: Response) => {
      const metadata: OAuthProtectedResourceMetadata = {
        resource: config.baseURL,
        authorization_servers: [`https://${config.authkitDomain}`],
        bearer_methods_supported: ["header"],
        resource_documentation: `${config.baseURL}/docs`,
      };

      res.json(metadata);
    }
  );

  /**
   * OAuth Authorization Server Metadata endpoint
   * Proxies/constructs AuthKit's OAuth metadata
   */
  router.get(
    "/.well-known/oauth-authorization-server",
    async (_req: Request, res: Response) => {
      try {
        // Fetch the actual OAuth metadata from AuthKit
        const authkitMetadataUrl = `https://${config.authkitDomain}/.well-known/openid-configuration`;

        const response = await fetch(authkitMetadataUrl);

        if (!response.ok) {
          // Construct metadata manually if fetch fails
          const metadata: OAuthAuthorizationServerMetadata = {
            issuer: `https://${config.authkitDomain}`,
            authorization_endpoint: `https://${config.authkitDomain}/oauth2/authorize`,
            token_endpoint: `https://${config.authkitDomain}/oauth2/token`,
            jwks_uri: `https://${config.authkitDomain}/oauth2/jwks`,
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

  /**
   * OAuth callback endpoint
   * Handles the authorization code from AuthKit hosted UI
   */
  router.get("/auth/callback", async (req: Request, res: Response) => {
    const { code, error, error_description } = req.query;

    // Handle error from AuthKit
    if (error) {
      res.status(400).json({
        error: error as string,
        error_description: error_description as string,
      });
      return;
    }

    // Validate authorization code
    if (!code || typeof code !== "string") {
      res.status(400).json({
        error: "invalid_request",
        error_description: "Missing authorization code",
      });
      return;
    }

    try {
      const workos = getWorkOSClient();

      // Exchange authorization code for tokens
      const authResult = await workos.userManagement.authenticateWithCode({
        clientId: config.clientId,
        code,
      });

      // Return authentication result
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

/**
 * Create the WorkOS authentication middleware
 * Protects /mcp routes by verifying JWT tokens
 */
function workosMiddleware(config: WorkOSConfig): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only protect /mcp routes
    if (!req.path.startsWith("/mcp")) {
      next();
      return;
    }

    try {
      // Extract bearer token from Authorization header
      const token = extractBearerToken(req.headers.authorization);

      if (!token) {
        // Return 401 with WWW-Authenticate header per MCP OAuth spec
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

      // Verify the JWT token
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

      // Convert claims to session and store in context
      const session = claimsToSession(claims);

      // Run the rest of the request within the context
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
