import {
  Router,
  json,
  urlencoded,
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from "express";
import { WorkOS } from "@workos-inc/node";
import type { Middleware } from "xmcp";
import type { WorkOSConfig, WorkOSInternalConfig, ProtectedResourceMetadata } from "./types.js";
import { workosContextProvider } from "./context.js";
import { extractBearerToken, verifyAccessToken, getAuthKitBaseUrl } from "./utils.js";

export function workosProvider(config: WorkOSConfig): Middleware {
  if (!config.apiKey) {
    throw new Error("workosProvider: apiKey is required");
  }
  if (!config.clientId) {
    throw new Error("workosProvider: clientId is required");
  }
  if (!config.authkitDomain) {
    throw new Error("workosProvider: authkitDomain is required");
  }
  if (!config.baseURL) {
    throw new Error("workosProvider: baseURL is required");
  }

  const client = new WorkOS(config.apiKey, {
    clientId: config.clientId,
  });

  const internalConfig: WorkOSInternalConfig = {
    ...config,
    client,
  };

  return {
    middleware: workosMiddleware(internalConfig),
    router: workosRouter(internalConfig),
  };
}

/**
 * Middleware to protect /mcp routes with WorkOS AuthKit authentication
 */
function workosMiddleware(config: WorkOSInternalConfig): RequestHandler {
  const authKitBaseUrl = getAuthKitBaseUrl(config.authkitDomain);

  const getOAuthMetadata = async (): Promise<Record<string, unknown>> => {
    const response = await fetch(
      `${authKitBaseUrl}/.well-known/oauth-authorization-server`
    );
    if (response.ok) {
      return (await response.json()) as Record<string, unknown>;
    }
    // Fallback metadata
    return {
      issuer: authKitBaseUrl,
      authorization_endpoint: `${authKitBaseUrl}/oauth2/authorize`,
      token_endpoint: `${authKitBaseUrl}/oauth2/token`,
      registration_endpoint: `${authKitBaseUrl}/oauth2/register`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"],
    };
  };

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.path.startsWith("/mcp")) {
      next();
      return;
    }

    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      // Return full OAuth metadata in 401 response
      try {
        const oauthConfig = await getOAuthMetadata();
        res.status(401).json(oauthConfig);
      } catch {
        res.status(500).json({ error: "Failed to fetch OAuth configuration" });
      }
      return;
    }

    // Verify the JWT using WorkOS JWKS
    const payload = await verifyAccessToken(
      token,
      config.authkitDomain,
      config.clientId
    );

    if (!payload) {
      // Token verification failed
      try {
        const oauthConfig = await getOAuthMetadata();
        res.status(401).json(oauthConfig);
      } catch {
        res.status(500).json({ error: "Failed to fetch OAuth configuration" });
      }
      return;
    }

    workosContextProvider(
      {
        config,
        headers: req.headers,
        payload,
      },
      () => {
        next();
      }
    );
  };
}

/**
 * Router for metadata endpoints and OAuth proxies
 */
function workosRouter(config: WorkOSInternalConfig): Router {
  const router = Router();
  const authKitBaseUrl = getAuthKitBaseUrl(config.authkitDomain);

  router.use(json());
  router.use(urlencoded({ extended: true }));

  router.use((req: Request, _res: Response, next: NextFunction) => {
    workosContextProvider(
      {
        config,
        headers: req.headers,
      },
      () => {
        next();
      }
    );
  });

  router.get("/.well-known/oauth-protected-resource", (_req, res) => {
    const metadata: ProtectedResourceMetadata = {
      resource: config.baseURL,
      authorization_servers: [authKitBaseUrl],
      bearer_methods_supported: ["header"],
    };
    res.json(metadata);
  });

  router.get("/.well-known/oauth-authorization-server", async (_req, res) => {
    try {
      const response = await fetch(
        `${authKitBaseUrl}/.well-known/oauth-authorization-server`
      );

      if (!response.ok) {
        res.status(response.status).json({
          error: "Failed to fetch authorization server metadata",
        });
        return;
      }

      const metadata = await response.json();
      res.json(metadata);
    } catch {
      res.status(500).json({
        error: "Failed to fetch authorization server metadata",
      });
    }
  });

  /**
   * OAuth authorize endpoint - redirect to AuthKit
   */
  router.get("/authorize", (req, res) => {
    const authkitUrl = new URL(`${authKitBaseUrl}/oauth2/authorize`);
    Object.entries(req.query).forEach(([key, value]) => {
      if (typeof value === "string") {
        authkitUrl.searchParams.set(key, value);
      }
    });
    res.redirect(authkitUrl.toString());
  });

  router.post("/authorize", (_req, res) => {
    res.redirect(307, `${authKitBaseUrl}/oauth2/authorize`);
  });

  router.post("/token", async (req, res) => {
    try {
      const response = await fetch(`${authKitBaseUrl}/oauth2/token`, {
        method: "POST",
        headers: {
          "Content-Type": req.headers["content-type"] || "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(req.body as Record<string, string>),
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch {
      res.status(500).json({ error: "Failed to proxy token request" });
    }
  });

  router.post("/register", async (req, res) => {
    try {
      const response = await fetch(`${authKitBaseUrl}/oauth2/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch {
      res.status(500).json({ error: "Failed to proxy register request" });
    }
  });

  /**
   * OAuth callback endpoint - handles redirect from AuthKit after login
   */
  router.get("/auth/callback", async (req, res) => {
    const { code, state, error, error_description } = req.query as Record<string, string | undefined>;

    if (error) {
      res.status(400).json({
        error,
        error_description,
      });
      return;
    }

    if (!code) {
      res.status(400).json({
        error: "missing_code",
        error_description: "Authorization code is required",
      });
      return;
    }

    try {
      const authResult = await config.client.userManagement.authenticateWithCode({
        code,
        clientId: config.clientId,
      });

      res.json({
        access_token: authResult.accessToken,
        refresh_token: authResult.refreshToken,
        token_type: "Bearer",
        ...(state && { state }),
      });
    } catch (err) {
      res.status(500).json({
        error: "token_exchange_failed",
        error_description: err instanceof Error ? err.message : "Failed to exchange authorization code for tokens",
      });
    }
  });

  return router;
}
