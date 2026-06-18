import Descope from "@descope/node-sdk";
import type { RequestHandler, Router as ExpressRouter } from "express";
import { Router } from "express";
import type { Middleware } from "xmcp";
import { providerClientContext, providerSessionContext } from "./context.js";
import { extractBearerToken, validateToken } from "./jwt.js";
import type { DescopeConfig, OAuthAuthorizationServerMetadata, OAuthProtectedResourceMetadata } from "./types.js";

const DEFAULT_SCOPES = ["openid", "profile", "email"];
const RESOURCE_METADATA_PATH = "/.well-known/oauth-protected-resource";
const WWW_AUTH_BASE = `Bearer resource_metadata="${RESOURCE_METADATA_PATH}"`;

function parseProjectId(issuerURL: string): string {
  const segments = new URL(issuerURL).pathname.replace(/^\//, "").split("/").filter(Boolean);
  if (!segments[0]) throw new Error(`DescopeConfig.issuerURL is invalid: cannot parse project ID from "${issuerURL}"`);
  return segments[0];
}

function descopeRouter(config: DescopeConfig, projectId: string): ExpressRouter {
  const { issuerURL, baseURL, scopesSupported = DEFAULT_SCOPES } = config;
  const router = Router();

  router.get(RESOURCE_METADATA_PATH, (_req, res) => {
    const body: OAuthProtectedResourceMetadata = {
      resource: baseURL,
      authorization_servers: [issuerURL],
      scopes_supported: scopesSupported,
      bearer_methods_supported: ["header"],
    };
    res.json(body);
  });

  router.get("/.well-known/oauth-authorization-server", async (_req, res) => {
    try {
      const resp = await fetch(`${issuerURL}/.well-known/openid-configuration`);
      if (!resp.ok) throw new Error(`Upstream ${resp.status}`);
      const discovery = (await resp.json()) as OAuthAuthorizationServerMetadata;
      res.json(discovery);
    } catch {
      const fallback: OAuthAuthorizationServerMetadata = {
        issuer: issuerURL,
        authorization_endpoint: `${issuerURL}/oauth2/v1/authorize`,
        token_endpoint: `${issuerURL}/oauth2/v1/token`,
        jwks_uri: `https://api.descope.com/${projectId}/.well-known/jwks.json`,
        response_types_supported: ["code"],
        grant_types_supported: ["authorization_code", "refresh_token"],
        code_challenge_methods_supported: ["S256"],
      };
      res.json(fallback);
    }
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
    }).catch(() => {
      res.setHeader("WWW-Authenticate", `${WWW_AUTH_BASE}, error="invalid_token"`);
      res.status(401).json({ error: "server_error", error_description: "Authentication processing failed" });
    });
  };
}

export function descopeProvider(config: DescopeConfig): Middleware {
  if (!config.issuerURL) throw new Error("DescopeConfig.issuerURL is required");
  if (!config.baseURL) throw new Error("DescopeConfig.baseURL is required");

  const projectId = parseProjectId(config.issuerURL);

  const sdk = Descope({
    projectId,
    managementKey: config.managementKey,
  });

  const router = descopeRouter(config, projectId);
  const rawMiddleware = descopeMiddleware(config, sdk);

  const middleware: RequestHandler = (req, res, next) => {
    providerClientContext({ client: sdk, projectId, managementKey: config.managementKey }, () => {
      rawMiddleware(req, res, next);
    });
  };

  return { middleware, router };
}
