import { Router, Request, Response, NextFunction } from "express";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types";
import {
  OAuthRouterConfig,
  AuthorizeParams,
  TokenParams,
  RevokeParams,
  OAuthError,
} from "./types";

export function createOAuthRouter(config: OAuthRouterConfig): Router {
  const router = Router();
  const { provider, resolvedConfig } = config;
  const issuerUrl = new URL(resolvedConfig.issuerUrl);
  const baseUrl = new URL(resolvedConfig.baseUrl);
  const serviceDocumentationUrl = resolvedConfig.serviceDocumentationUrl
    ? new URL(resolvedConfig.serviceDocumentationUrl)
    : undefined;
  const mcpEndpoint = normalizeProtectedPath(config.mcpEndpoint ?? "/mcp");
  const pathPrefix = resolvedConfig.pathPrefix;
  const localAuthorizeUrl = `${baseUrl.toString().replace(/\/$/, "")}${pathPrefix}/authorize`;
  const localTokenUrl = `${baseUrl.toString().replace(/\/$/, "")}${pathPrefix}/token`;
  const localRegisterUrl = `${baseUrl.toString().replace(/\/$/, "")}${pathPrefix}/register`;
  const localRevokeUrl = `${baseUrl.toString().replace(/\/$/, "")}${pathPrefix}/revoke`;
  const localIntrospectUrl = `${baseUrl.toString().replace(/\/$/, "")}${pathPrefix}/introspect`;
  const pathScopedResourceMetadataPath = getProtectedResourceMetadataPath(
    mcpEndpoint
  );

  router.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Accept, mcp-protocol-version"
    );
    res.setHeader("Access-Control-Expose-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }

    next();
  });

  const sendProtectedResourceMetadata = (_req: Request, res: Response) => {
    res.json({
      resource: resolvedConfig.resourceUrl,
      authorization_servers: [issuerUrl.toString()],
      bearer_methods_supported: ["header"],
      resource_documentation: serviceDocumentationUrl?.toString(),
      ...((provider.endpoints.introspectionUrl || resolvedConfig.jwksUrl) && {
        introspection_endpoint: localIntrospectUrl,
      }),
      ...(provider.endpoints.revocationUrl && {
        revocation_endpoint: localRevokeUrl,
      }),
    });
  };

  router.get("/.well-known/oauth-protected-resource", sendProtectedResourceMetadata);
  router.get(pathScopedResourceMetadataPath, sendProtectedResourceMetadata);

  router.get("/.well-known/oauth-authorization-server", (_req, res) => {
    res.json({
      issuer: issuerUrl.toString(),
      authorization_endpoint: localAuthorizeUrl,
      token_endpoint: localTokenUrl,
      ...(provider.endpoints.revocationUrl && {
        revocation_endpoint: localRevokeUrl,
      }),
      ...((provider.endpoints.introspectionUrl || resolvedConfig.jwksUrl) && {
        introspection_endpoint: localIntrospectUrl,
      }),
      response_types_supported:
        resolvedConfig.providerMetadata.responseTypesSupported,
      grant_types_supported: resolvedConfig.providerMetadata.grantTypesSupported,
      token_endpoint_auth_methods_supported:
        resolvedConfig.providerMetadata.tokenEndpointAuthMethodsSupported,
      scopes_supported:
        resolvedConfig.providerMetadata.scopesSupported ??
        resolvedConfig.defaultScopes,
      code_challenge_methods_supported:
        resolvedConfig.providerMetadata.codeChallengeMethodsSupported,
      registration_endpoint: localRegisterUrl,
      ...(resolvedConfig.providerMetadata.jwksUri && {
        jwks_uri: resolvedConfig.providerMetadata.jwksUri,
      }),
      ...(serviceDocumentationUrl && {
        service_documentation: serviceDocumentationUrl.toString(),
      }),
    });
  });

  router.get(`${pathPrefix}/authorize`, async (req, res) => {
    try {
      const params: AuthorizeParams = {
        response_type: req.query.response_type as string,
        client_id: req.query.client_id as string,
        redirect_uri: req.query.redirect_uri as string,
        scope: req.query.scope as string,
        state: req.query.state as string,
        code_challenge: req.query.code_challenge as string,
        code_challenge_method: req.query.code_challenge_method as string,
        resource: firstParam(req.query.resource),
        audience: firstParam(req.query.audience),
        additionalProviderParams: getAdditionalProviderParams(req.query),
      };

      if (!params.response_type || !params.client_id || !params.redirect_uri) {
        res.status(400).json({
          error: "invalid_request",
          error_description: "Missing required parameters",
        });
        return;
      }

      if (!params.code_challenge || !params.code_challenge_method) {
        res.status(400).json({
          error: "invalid_request",
          error_description:
            "PKCE parameters (code_challenge, code_challenge_method) are required",
        });
        return;
      }

      if (params.code_challenge_method !== "S256") {
        res.status(400).json({
          error: "invalid_request",
          error_description: "Only S256 code challenge method is supported",
        });
        return;
      }

      const authUrl = await provider.authorize(params);
      res.redirect(authUrl);
    } catch (error) {
      res.status(400).json(extractOAuthError(error));
    }
  });

  router.post(`${pathPrefix}/token`, async (req, res) => {
    try {
      const params: TokenParams = {
        grant_type: req.body.grant_type,
        client_id: req.body.client_id,
        client_secret: req.body.client_secret,
        code: req.body.code,
        redirect_uri: req.body.redirect_uri,
        refresh_token: req.body.refresh_token,
        code_verifier: req.body.code_verifier,
        resource: firstBodyParam(req.body?.resource),
        audience: firstBodyParam(req.body?.audience),
      };

      if (!params.grant_type || !params.client_id) {
        res.status(400).json({
          error: "invalid_request",
          error_description: "Missing required parameters",
        });
        return;
      }

      if (params.grant_type === "authorization_code" && !params.code_verifier) {
        res.status(400).json({
          error: "invalid_request",
          error_description:
            "code_verifier is required for authorization_code grant (PKCE)",
        });
        return;
      }

      const tokenResponse = await provider.token(params);
      res.json(tokenResponse);
    } catch (error) {
      res.status(400).json(extractOAuthError(error));
    }
  });

  router.post(`${pathPrefix}/revoke`, async (req, res) => {
    try {
      const params: RevokeParams = {
        token: req.body.token,
        token_type_hint: req.body.token_type_hint,
        client_id: req.body.client_id,
        client_secret: req.body.client_secret,
      };

      if (!params.token) {
        res.status(400).json({
          error: "invalid_request",
          error_description: "Missing token parameter",
        });
        return;
      }

      await provider.revoke(params);
      res.status(200).end();
    } catch (error) {
      res.status(400).json(extractOAuthError(error));
    }
  });

  router.post(`${pathPrefix}/introspect`, async (req, res) => {
    try {
      const token = req.body.token;

      if (!token) {
        res.status(400).json({
          error: "invalid_request",
          error_description: "Missing token parameter",
        });
        return;
      }

      const accessToken = await provider.verifyAccessToken(token);

      res.json({
        active: true,
        client_id: accessToken.clientId,
        scope: accessToken.scopes.join(" "),
        exp: accessToken.expiresAt
          ? Math.floor(accessToken.expiresAt.getTime() / 1000)
          : undefined,
        aud: accessToken.resource?.toString(),
      });
    } catch {
      res.json({ active: false });
    }
  });

  router.all(`${pathPrefix}/register`, async (req, res) => {
    try {
      if (req.method === "GET") {
        res.redirect(provider.endpoints.registerUrl);
        return;
      }

      const response = await fetch(provider.endpoints.registerUrl, {
        method: req.method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(req.headers["user-agent"] && {
            "User-Agent": req.headers["user-agent"] as string,
          }),
        },
        body: JSON.stringify(req.body),
      });

      const registrationData = await response.json();
      res.status(response.status).json(registrationData);
    } catch {
      res.status(500).json({
        error: "server_error",
        error_description: "Failed to register client",
      });
    }
  });

  return router;
}

export function createOAuthMiddleware(
  provider: {
  verifyAccessToken(token: string): Promise<{
    token: string;
    clientId: string;
    scopes: string[];
    expiresAt?: Date;
    resource?: URL;
    extra?: Record<string, unknown>;
  }>;
  },
  options: {
    protectedPath?: string;
  } = {}
) {
  const protectedPath = normalizeProtectedPath(options.protectedPath ?? "/mcp");
  const resourceMetadataPath = getProtectedResourceMetadataPath(protectedPath);

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!matchesProtectedPath(req.path, protectedPath)) {
      next();
      return;
    }

    try {
      const authHeader = req.header("Authorization");

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.setHeader(
          "WWW-Authenticate",
          `Bearer resource_metadata="${resourceMetadataPath}"`
        );
        res.status(401).json({
          error: "invalid_token",
          error_description: "Missing or malformed Authorization header",
        });
        return;
      }

      const token = authHeader.slice("Bearer ".length).trim();

      if (!token) {
        res.status(401).json({
          error: "invalid_token",
          error_description: "Missing access token",
        });
        return;
      }

      const accessToken = await provider.verifyAccessToken(token);

      (req as Request & { auth?: AuthInfo }).auth = {
        token: accessToken.token,
        clientId: accessToken.clientId,
        scopes: accessToken.scopes,
        expiresAt: accessToken.expiresAt
          ? Math.floor(accessToken.expiresAt.getTime() / 1000)
          : undefined,
        resource: accessToken.resource,
        extra: accessToken.extra,
      };

      next();
    } catch (error) {
      const oauthError = extractOAuthError(error);
      res.setHeader(
        "WWW-Authenticate",
        `Bearer error="${oauthError.error}", error_description="${oauthError.error_description ?? "Invalid token"}", resource_metadata="${resourceMetadataPath}"`
      );
      res.status(401).json(oauthError);
    }
  };
}

function normalizeProtectedPath(path: string): string {
  if (!path || path === "/") {
    return "/mcp";
  }

  return path.startsWith("/") ? path : `/${path}`;
}

function getProtectedResourceMetadataPath(protectedPath: string): string {
  return `/.well-known/oauth-protected-resource${normalizeProtectedPath(
    protectedPath
  )}`;
}

function matchesProtectedPath(pathname: string, protectedPath: string): boolean {
  return pathname === protectedPath || pathname.startsWith(`${protectedPath}/`);
}

function firstParam(
  value: unknown
): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : undefined;
  }

  return undefined;
}

function firstBodyParam(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function getAdditionalProviderParams(
  query: Request["query"]
): Record<string, string> | undefined {
  const reservedParams = new Set([
    "response_type",
    "client_id",
    "redirect_uri",
    "scope",
    "state",
    "code_challenge",
    "code_challenge_method",
    "resource",
    "audience",
  ]);
  const entries = Object.entries(query).flatMap(([key, value]) => {
    if (reservedParams.has(key)) {
      return [];
    }

    const normalized = firstParam(value);
    return normalized ? [[key, normalized] as const] : [];
  });

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function extractOAuthError(error: unknown): OAuthError {
  if (
    error &&
    typeof error === "object" &&
    "oauth" in error &&
    (error as any).oauth
  ) {
    return (error as any).oauth as OAuthError;
  }

  return {
    error: "server_error",
    error_description:
      error instanceof Error ? error.message : "Internal server error",
  };
}
