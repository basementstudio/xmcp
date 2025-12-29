import {
  Router,
  json,
  urlencoded,
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from "express";
import type { Middleware } from "xmcp";
import type { WorkOSConfig, ProtectedResourceMetadata } from "./types.js";
import { workosContextProvider } from "./context.js";
import { extractBearerToken } from "./utils.js";

/**
 * Decode a JWT payload without verification
 * Since the token comes from WorkOS AuthKit, we trust it
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }
    const payload = Buffer.from(parts[1], "base64url").toString("utf-8");
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

/**
 * Create the WorkOS authentication provider for xmcp
 */
export function workosProvider(config: WorkOSConfig): Middleware {
  return {
    middleware: workosMiddleware(config),
    router: workosRouter(config),
  };
}

/**
 * Middleware to protect /mcp routes with WorkOS AuthKit authentication
 */
function workosMiddleware(config: WorkOSConfig): RequestHandler {
  // Cache for OAuth metadata
  let cachedOAuthMetadata: Record<string, unknown> | null = null;

  // Fetch OAuth metadata from AuthKit
  const getOAuthMetadata = async (): Promise<Record<string, unknown>> => {
    if (cachedOAuthMetadata) {
      return cachedOAuthMetadata;
    }
    const response = await fetch(
      `https://${config.authkitDomain}/.well-known/oauth-authorization-server`
    );
    if (response.ok) {
      cachedOAuthMetadata = (await response.json()) as Record<string, unknown>;
      return cachedOAuthMetadata;
    }
    // Fallback metadata
    return {
      issuer: `https://${config.authkitDomain}`,
      authorization_endpoint: `https://${config.authkitDomain}/oauth2/authorize`,
      token_endpoint: `https://${config.authkitDomain}/oauth2/token`,
      registration_endpoint: `https://${config.authkitDomain}/oauth2/register`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"],
    };
  };

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only protect /mcp routes
    if (!req.path.startsWith("/mcp")) {
      next();
      return;
    }

    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      // Return full OAuth metadata in 401 response (like better-auth does)
      try {
        const oauthConfig = await getOAuthMetadata();
        res.status(401).json(oauthConfig);
      } catch {
        res.status(500).json({ error: "Failed to fetch OAuth configuration" });
      }
      return;
    }

    // Decode the JWT payload (we trust tokens from AuthKit)
    const payload = decodeJwtPayload(token);
    
    if (!payload) {
      try {
        const oauthConfig = await getOAuthMetadata();
        res.status(401).json(oauthConfig);
      } catch {
        res.status(500).json({ error: "Failed to fetch OAuth configuration" });
      }
      return;
    }

    // Check token expiration
    const exp = payload.exp as number | undefined;
    if (exp && exp * 1000 < Date.now()) {
      try {
        const oauthConfig = await getOAuthMetadata();
        res.status(401).json(oauthConfig);
      } catch {
        res.status(500).json({ error: "Failed to fetch OAuth configuration" });
      }
      return;
    }

    // Token is valid, set up context and proceed
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
function workosRouter(config: WorkOSConfig): Router {
  const router = Router();

  // Parse request bodies for OAuth endpoints
  router.use(json());
  router.use(urlencoded({ extended: true }));

  // Set up context for all router requests
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

  /**
   * OAuth Protected Resource Metadata endpoint
   * Modern MCP clients use this to discover the authorization server
   * https://workos.com/docs/authkit/mcp
   */
  router.get("/.well-known/oauth-protected-resource", (_req, res) => {
    const metadata: ProtectedResourceMetadata = {
      resource: config.baseURL,
      authorization_servers: [`https://${config.authkitDomain}`],
      bearer_methods_supported: ["header"],
    };
    res.json(metadata);
  });

  /**
   * OAuth Authorization Server Metadata proxy
   * For older MCP clients that don't support oauth-protected-resource
   * Proxies to AuthKit's metadata endpoint
   */
  router.get("/.well-known/oauth-authorization-server", async (_req, res) => {
    try {
      const response = await fetch(
        `https://${config.authkitDomain}/.well-known/oauth-authorization-server`
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
   * Some MCP clients expect OAuth endpoints on the MCP server
   */
  router.get("/authorize", (req, res) => {
    const authkitUrl = new URL(`https://${config.authkitDomain}/oauth2/authorize`);
    // Forward all query parameters
    Object.entries(req.query).forEach(([key, value]) => {
      if (typeof value === "string") {
        authkitUrl.searchParams.set(key, value);
      }
    });
    res.redirect(authkitUrl.toString());
  });

  router.post("/authorize", (_req, res) => {
    res.redirect(307, `https://${config.authkitDomain}/oauth2/authorize`);
  });

  /**
   * OAuth token endpoint - proxy to AuthKit
   */
  router.post("/token", async (req, res) => {
    try {
      const response = await fetch(`https://${config.authkitDomain}/oauth2/token`, {
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

  /**
   * OAuth register endpoint - proxy to AuthKit for DCR
   */
  router.post("/register", async (req, res) => {
    try {
      const response = await fetch(`https://${config.authkitDomain}/oauth2/register`, {
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
   * Exchanges the authorization code for tokens and returns them
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
      // Exchange the authorization code for tokens at AuthKit
      const tokenResponse = await fetch(`https://${config.authkitDomain}/oauth2/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: config.clientId,
          redirect_uri: `${config.baseURL}/auth/callback`,
        }),
      });

      const tokenData = (await tokenResponse.json()) as Record<string, unknown>;

      if (!tokenResponse.ok) {
        res.status(tokenResponse.status).json(tokenData);
        return;
      }

      // Return tokens as JSON (MCP clients will handle this)
      res.json({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_type: (tokenData.token_type as string) || "Bearer",
        expires_in: tokenData.expires_in,
        ...(state && { state }),
      });
    } catch {
      res.status(500).json({
        error: "token_exchange_failed",
        error_description: "Failed to exchange authorization code for tokens",
      });
    }
  });

  return router;
}
