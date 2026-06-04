import Descope from "@descope/node-sdk";
import type { RequestHandler, Router as ExpressRouter } from "express";
import { Router } from "express";
import { providerClientContext, providerSessionContext } from "./context.js";
import { extractBearerToken, validateToken } from "./jwt.js";
import type { DescopeConfig, OAuthAuthorizationServerMetadata, OAuthProtectedResourceMetadata } from "./types.js";

const DEFAULT_SCOPES = ["openid", "profile", "email"];
const RESOURCE_METADATA_PATH = "/.well-known/oauth-protected-resource";
const WWW_AUTH_BASE = `Bearer resource_metadata="${RESOURCE_METADATA_PATH}"`;

function descopeRouter(config: DescopeConfig): ExpressRouter {
  const { projectId, mcpServerId, baseURL, scopesSupported = DEFAULT_SCOPES } = config;
  const router = Router();

  router.get(RESOURCE_METADATA_PATH, (_req, res) => {
    const body: OAuthProtectedResourceMetadata = {
      resource: baseURL,
      authorization_servers: [
        `https://api.descope.com/oauth2/v1/apps/agentic/${projectId}/${mcpServerId}`,
      ],
      scopes_supported: scopesSupported,
      bearer_methods_supported: ["header"],
    };
    res.json(body);
  });

  let cachedDiscovery: OAuthAuthorizationServerMetadata | null = null;

  router.get("/.well-known/oauth-authorization-server", async (_req, res) => {
    if (!cachedDiscovery) {
      try {
        const resp = await fetch(
          `https://api.descope.com/${projectId}/.well-known/openid-configuration`,
        );
        if (!resp.ok) throw new Error(`Upstream ${resp.status}`);
        cachedDiscovery = (await resp.json()) as OAuthAuthorizationServerMetadata;
      } catch {
        cachedDiscovery = {
          issuer: `https://api.descope.com/${projectId}`,
          authorization_endpoint: `https://api.descope.com/oauth2/v1/apps/agentic/${projectId}/${mcpServerId}/authorize`,
          token_endpoint: `https://api.descope.com/oauth2/v1/apps/agentic/${projectId}/${mcpServerId}/token`,
          jwks_uri: `https://api.descope.com/${projectId}/.well-known/jwks.json`,
          response_types_supported: ["code"],
          grant_types_supported: ["authorization_code", "refresh_token"],
          code_challenge_methods_supported: ["S256"],
        };
      }
    }
    res.json(cachedDiscovery);
  });

  return router;
}

function descopeMiddleware(
  config: DescopeConfig,
  sdk: ReturnType<typeof Descope>,
): RequestHandler {
  return (req, res, next) => {
    if (!req.path.startsWith("/mcp")) {
      next();
      return;
    }

    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      res.setHeader("WWW-Authenticate", WWW_AUTH_BASE);
      res.status(401).json({
        error: "unauthorized",
        error_description: "Missing or invalid bearer token",
      });
      return;
    }

    validateToken(sdk, token).then((result) => {
      if (!result.ok) {
        if (result.error === "expired") {
          res.setHeader(
            "WWW-Authenticate",
            `${WWW_AUTH_BASE}, error="invalid_token", error_description="Token has expired"`,
          );
          res.status(401).json({ error: "token_expired" });
        } else {
          res.setHeader("WWW-Authenticate", `${WWW_AUTH_BASE}, error="invalid_token"`);
          res.status(401).json({ error: "invalid_token" });
        }
        return;
      }

      const { session } = result;
      providerSessionContext({ session }, () => {
        next();
      });
    });
  };
}

export function descopeProvider(config: DescopeConfig): {
  middleware: RequestHandler;
  router: ExpressRouter;
} {
  if (!config.projectId) throw new Error("DescopeConfig.projectId is required");
  if (!config.mcpServerId) throw new Error("DescopeConfig.mcpServerId is required");
  if (!config.baseURL) throw new Error("DescopeConfig.baseURL is required");

  const sdk = Descope({
    projectId: config.projectId,
    managementKey: config.managementKey,
  });

  const router = descopeRouter(config);
  const rawMiddleware = descopeMiddleware(config, sdk);

  const middleware: RequestHandler = (req, res, next) => {
    providerClientContext({ client: sdk, managementKey: config.managementKey }, () => {
      rawMiddleware(req, res, next);
    });
  };

  return { middleware, router };
}
