import crypto, { randomUUID } from "node:crypto";
import express from "express";
import {
  exportJWK,
  generateKeyPair,
  jwtVerify,
  SignJWT,
  type JWK,
} from "jose";

const PROVIDER_PORT = 4405;
const PROVIDER_BASE_URL = `http://127.0.0.1:${PROVIDER_PORT}`;
const RESOURCE_SERVER_BASE_URL = "http://127.0.0.1:3005";
const DEMO_CLIENT_ID = "demo-client";
const DEMO_CLIENT_SECRET = "demo-secret";
const RESOURCE_SERVER_CLIENT_ID = "resource-server";
const RESOURCE_SERVER_CLIENT_SECRET = "resource-server-secret";
const DEMO_REDIRECT_URI = `${PROVIDER_BASE_URL}/debug/callback`;
type DemoUser = {
  sub: string;
  email: string;
  name: string;
  organization?: string;
};

const DEMO_USER: DemoUser = {
  sub: "demo-user-456",
  email: "demo@example.com",
  name: "Demo User",
  organization: "xmcp",
};
const DEFAULT_SCOPES = ["openid", "profile", "email", "tool:whoami"];
const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

type Client = {
  clientId: string;
  clientSecret?: string;
  clientName: string;
  redirectUris: string[];
  tokenEndpointAuthMethod: "client_secret_basic" | "client_secret_post" | "none";
};

type AuthorizationCodeRecord = {
  code: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  audience: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
  user: DemoUser;
  expiresAt: number;
};

type AccessTokenRecord = {
  token: string;
  clientId: string;
  scopes: string[];
  user: DemoUser;
  audience: string;
  expiresAt: number;
  refreshToken?: string;
  revoked: boolean;
};

type RefreshTokenRecord = {
  refreshToken: string;
  clientId: string;
  scopes: string[];
  user: DemoUser;
  audience: string;
  expiresAt: number;
  revoked: boolean;
};

const clients = new Map<string, Client>();
const authorizationCodes = new Map<string, AuthorizationCodeRecord>();
const accessTokens = new Map<string, AccessTokenRecord>();
const refreshTokens = new Map<string, RefreshTokenRecord>();

function registerSeedClients() {
  clients.set(DEMO_CLIENT_ID, {
    clientId: DEMO_CLIENT_ID,
    clientSecret: DEMO_CLIENT_SECRET,
    clientName: "Demo Native OAuth Client",
    redirectUris: [DEMO_REDIRECT_URI],
    tokenEndpointAuthMethod: "client_secret_post",
  });
  clients.set(RESOURCE_SERVER_CLIENT_ID, {
    clientId: RESOURCE_SERVER_CLIENT_ID,
    clientSecret: RESOURCE_SERVER_CLIENT_SECRET,
    clientName: "Custom Middleware Resource Server",
    redirectUris: [],
    tokenEndpointAuthMethod: "client_secret_basic",
  });
}

function renderConsentPage(params: {
  client: Client;
  redirectUri: string;
  state?: string;
  scope: string;
  audience: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  user: DemoUser;
}) {
  const {
    client,
    redirectUri,
    state,
    scope,
    audience,
    codeChallenge,
    codeChallengeMethod,
    user,
  } = params;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Authorize ${client.clientName}</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, sans-serif; background: #f5f5f0; color: #1f2937; margin: 0; padding: 32px; }
      main { max-width: 640px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 18px 50px rgba(0,0,0,0.08); }
      h1 { margin-top: 0; }
      code { background: #f3f4f6; padding: 2px 6px; border-radius: 6px; }
      .actions { display: flex; gap: 12px; margin-top: 24px; }
      button { border: 0; border-radius: 999px; padding: 12px 18px; cursor: pointer; }
      .approve { background: #111827; color: white; }
      .deny { background: #e5e7eb; color: #111827; }
      ul { line-height: 1.7; }
      label { display: block; margin-top: 16px; font-weight: 600; }
      input { width: 100%; box-sizing: border-box; margin-top: 6px; border: 1px solid #d1d5db; border-radius: 10px; padding: 12px; font: inherit; }
    </style>
  </head>
  <body>
    <main>
      <h1>Authorize ${client.clientName}</h1>
      <p>Update the identity below before approving. The values you submit will be minted into the access token and will appear in the MCP <code>whoami</code> tool.</p>
      <ul>
        <li>Redirect URI: <code>${redirectUri}</code></li>
        <li>Scopes: <code>${scope || DEFAULT_SCOPES.join(" ")}</code></li>
        <li>PKCE: <code>${codeChallengeMethod}</code></li>
      </ul>
      <form method="post" action="/authorize">
        <input type="hidden" name="client_id" value="${client.clientId}" />
        <input type="hidden" name="redirect_uri" value="${redirectUri}" />
        <input type="hidden" name="state" value="${state ?? ""}" />
        <input type="hidden" name="scope" value="${scope}" />
        <input type="hidden" name="audience" value="${audience}" />
        <input type="hidden" name="code_challenge" value="${codeChallenge}" />
        <input type="hidden" name="code_challenge_method" value="${codeChallengeMethod}" />
        <label>
          User ID
          <input type="text" name="user_id" value="${user.sub}" required />
        </label>
        <label>
          Name
          <input type="text" name="name" value="${user.name}" required />
        </label>
        <label>
          Email
          <input type="email" name="email" value="${user.email}" required />
        </label>
        <label>
          Organization
          <input type="text" name="organization" value="${user.organization ?? ""}" />
        </label>
        <div class="actions">
          <button class="approve" type="submit" name="decision" value="approve">Approve</button>
          <button class="deny" type="submit" name="decision" value="deny">Deny</button>
        </div>
      </form>
    </main>
  </body>
</html>`;
}

function readUserFromRequest(body: Record<string, unknown>): DemoUser {
  const sub =
    typeof body.user_id === "string" && body.user_id.trim().length > 0
      ? body.user_id.trim()
      : DEMO_USER.sub;
  const name =
    typeof body.name === "string" && body.name.trim().length > 0
      ? body.name.trim()
      : DEMO_USER.name;
  const email =
    typeof body.email === "string" && body.email.trim().length > 0
      ? body.email.trim()
      : DEMO_USER.email;
  const organization =
    typeof body.organization === "string" && body.organization.trim().length > 0
      ? body.organization.trim()
      : DEMO_USER.organization;

  return {
    sub,
    name,
    email,
    organization,
  };
}

function parseClientCredentials(
  authorizationHeader: string | undefined,
  body: Record<string, unknown>
) {
  if (authorizationHeader?.startsWith("Basic ")) {
    const decoded = Buffer.from(
      authorizationHeader.slice("Basic ".length),
      "base64"
    ).toString("utf8");
    const [clientId, clientSecret] = decoded.split(":");
    return { clientId, clientSecret };
  }

  return {
    clientId: typeof body.client_id === "string" ? body.client_id : undefined,
    clientSecret:
      typeof body.client_secret === "string" ? body.client_secret : undefined,
  };
}

function buildPkceChallenge(verifier: string) {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

function resolveAudience(value: unknown): string {
  return typeof value === "string" && value.length > 0
    ? value
    : RESOURCE_SERVER_BASE_URL;
}

async function issueAccessToken(
  signingKey: CryptoKey | Uint8Array,
  clientId: string,
  scopes: string[],
  user: DemoUser,
  audience: string
) {
  const expiresAt = Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL_SECONDS;
  const token = await new SignJWT({
    scope: scopes.join(" "),
    client_id: clientId,
    sub: user.sub,
    email: user.email,
    name: user.name,
    ...(user.organization && { organization: user.organization }),
  })
    .setProtectedHeader({ alg: "RS256", kid: "demo-key" })
    .setIssuer(PROVIDER_BASE_URL)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .setJti(randomUUID())
    .sign(signingKey);

  const refreshToken = `refresh_${randomUUID()}`;
  accessTokens.set(token, {
    token,
    clientId,
    scopes,
    user,
    audience,
    expiresAt,
    refreshToken,
    revoked: false,
  });

  refreshTokens.set(refreshToken, {
    refreshToken,
    clientId,
    scopes,
    user,
    audience,
    expiresAt: Math.floor(Date.now() / 1000) + REFRESH_TOKEN_TTL_SECONDS,
    revoked: false,
  });

  return { token, refreshToken, expiresAt };
}

async function start() {
  registerSeedClients();

  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const jwk = (await exportJWK(publicKey)) as JWK;
  jwk.use = "sig";
  jwk.alg = "RS256";
  jwk.kid = "demo-key";

  const app = express();
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.json({
      issuer: PROVIDER_BASE_URL,
      authorization_endpoint: `${PROVIDER_BASE_URL}/authorize`,
      token_endpoint: `${PROVIDER_BASE_URL}/token`,
      registration_endpoint: `${PROVIDER_BASE_URL}/register`,
      introspection_endpoint: `${PROVIDER_BASE_URL}/introspect`,
      jwks_uri: `${PROVIDER_BASE_URL}/.well-known/jwks.json`,
      demo_client_id: DEMO_CLIENT_ID,
      demo_redirect_uri: DEMO_REDIRECT_URI,
    });
  });

  app.get("/.well-known/jwks.json", (_req, res) => {
    res.json({ keys: [jwk] });
  });

  app.get("/.well-known/oauth-authorization-server", (_req, res) => {
    res.json({
      issuer: PROVIDER_BASE_URL,
      authorization_endpoint: `${PROVIDER_BASE_URL}/authorize`,
      token_endpoint: `${PROVIDER_BASE_URL}/token`,
      registration_endpoint: `${PROVIDER_BASE_URL}/register`,
      revocation_endpoint: `${PROVIDER_BASE_URL}/revoke`,
      introspection_endpoint: `${PROVIDER_BASE_URL}/introspect`,
      jwks_uri: `${PROVIDER_BASE_URL}/.well-known/jwks.json`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      token_endpoint_auth_methods_supported: [
        "client_secret_basic",
        "client_secret_post",
        "none",
      ],
      code_challenge_methods_supported: ["S256"],
      scopes_supported: DEFAULT_SCOPES,
    });
  });

  app.get("/.well-known/openid-configuration", (_req, res) => {
    res.json({
      issuer: PROVIDER_BASE_URL,
      authorization_endpoint: `${PROVIDER_BASE_URL}/authorize`,
      token_endpoint: `${PROVIDER_BASE_URL}/token`,
      registration_endpoint: `${PROVIDER_BASE_URL}/register`,
      revocation_endpoint: `${PROVIDER_BASE_URL}/revoke`,
      introspection_endpoint: `${PROVIDER_BASE_URL}/introspect`,
      jwks_uri: `${PROVIDER_BASE_URL}/.well-known/jwks.json`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      token_endpoint_auth_methods_supported: [
        "client_secret_basic",
        "client_secret_post",
        "none",
      ],
      code_challenge_methods_supported: ["S256"],
      scopes_supported: DEFAULT_SCOPES,
    });
  });

  app.get("/debug/callback", (req, res) => {
    res.send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Authorization Complete</title>
    <style>body { font-family: ui-sans-serif, system-ui, sans-serif; padding: 32px; }</style>
  </head>
  <body>
    <h1>Authorization complete</h1>
    <p>Copy the authorization code from this page into the token request.</p>
    <pre>code=${String(req.query.code ?? "")}
state=${String(req.query.state ?? "")}</pre>
  </body>
</html>`);
  });

  app.post("/register", (req, res) => {
    const redirectUris = Array.isArray(req.body?.redirect_uris)
      ? req.body.redirect_uris.filter(
          (uri: unknown): uri is string => typeof uri === "string"
        )
      : [];

    if (redirectUris.length === 0) {
      res.status(400).json({
        error: "invalid_client_metadata",
        error_description: "redirect_uris is required",
      });
      return;
    }

    const tokenEndpointAuthMethod =
      req.body?.token_endpoint_auth_method === "none"
        ? "none"
        : req.body?.token_endpoint_auth_method === "client_secret_basic"
          ? "client_secret_basic"
          : "client_secret_post";

    const clientId = `client_${randomUUID()}`;
    const clientSecret =
      tokenEndpointAuthMethod === "none" ? undefined : `secret_${randomUUID()}`;

    clients.set(clientId, {
      clientId,
      clientSecret,
      clientName:
        typeof req.body?.client_name === "string"
          ? req.body.client_name
          : "Dynamic Client",
      redirectUris,
      tokenEndpointAuthMethod,
    });

    res.status(201).json({
      client_id: clientId,
      client_secret: clientSecret,
      client_name: typeof req.body?.client_name === "string"
        ? req.body.client_name
        : "Dynamic Client",
      redirect_uris: redirectUris,
      token_endpoint_auth_method: tokenEndpointAuthMethod,
    });
  });

  app.get("/authorize", (req, res) => {
    const clientId =
      typeof req.query.client_id === "string" ? req.query.client_id : undefined;
    const redirectUri =
      typeof req.query.redirect_uri === "string"
        ? req.query.redirect_uri
        : undefined;
    const responseType =
      typeof req.query.response_type === "string"
        ? req.query.response_type
        : undefined;
    const codeChallenge =
      typeof req.query.code_challenge === "string"
        ? req.query.code_challenge
        : undefined;
    const codeChallengeMethod =
      typeof req.query.code_challenge_method === "string"
        ? req.query.code_challenge_method
        : undefined;

    if (
      !clientId ||
      !redirectUri ||
      responseType !== "code" ||
      !codeChallenge ||
      codeChallengeMethod !== "S256"
    ) {
      res.status(400).json({
        error: "invalid_request",
        error_description:
          "client_id, redirect_uri, response_type=code, code_challenge, and code_challenge_method=S256 are required",
      });
      return;
    }

    const client = clients.get(clientId);
    if (!client || !client.redirectUris.includes(redirectUri)) {
      res.status(400).json({
        error: "unauthorized_client",
        error_description: "Unknown client or redirect URI",
      });
      return;
    }

    res
      .status(200)
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .send(
        renderConsentPage({
          client,
          redirectUri,
          state: typeof req.query.state === "string" ? req.query.state : undefined,
          scope:
            typeof req.query.scope === "string"
              ? req.query.scope
              : DEFAULT_SCOPES.join(" "),
          audience: resolveAudience(req.query.resource ?? req.query.audience),
          codeChallenge,
          codeChallengeMethod,
          user: DEMO_USER,
        })
      );
  });

  app.post("/authorize", (req, res) => {
    const clientId =
      typeof req.body.client_id === "string" ? req.body.client_id : undefined;
    const redirectUri =
      typeof req.body.redirect_uri === "string"
        ? req.body.redirect_uri
        : undefined;
    const decision =
      typeof req.body.decision === "string" ? req.body.decision : "deny";
    const state = typeof req.body.state === "string" ? req.body.state : undefined;

    if (!clientId || !redirectUri) {
      res.status(400).json({
        error: "invalid_request",
        error_description: "client_id and redirect_uri are required",
      });
      return;
    }

    const client = clients.get(clientId);
    if (!client || !client.redirectUris.includes(redirectUri)) {
      res.status(400).json({
        error: "unauthorized_client",
        error_description: "Unknown client or redirect URI",
      });
      return;
    }

    const redirect = new URL(redirectUri);

    if (decision !== "approve") {
      redirect.searchParams.set("error", "access_denied");
      if (state) {
        redirect.searchParams.set("state", state);
      }
      res.redirect(redirect.toString());
      return;
    }

    const code = `code_${randomUUID()}`;
    const user = readUserFromRequest(req.body as Record<string, unknown>);
    authorizationCodes.set(code, {
      code,
      clientId,
      redirectUri,
      scopes:
        typeof req.body.scope === "string" && req.body.scope.length > 0
          ? req.body.scope.split(" ").filter(Boolean)
          : DEFAULT_SCOPES,
      audience: resolveAudience(req.body.resource ?? req.body.audience),
      codeChallenge:
        typeof req.body.code_challenge === "string" ? req.body.code_challenge : "",
      codeChallengeMethod: "S256",
      user,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    redirect.searchParams.set("code", code);
    if (state) {
      redirect.searchParams.set("state", state);
    }

    res.redirect(redirect.toString());
  });

  app.post("/token", async (req, res) => {
    const grantType =
      typeof req.body.grant_type === "string" ? req.body.grant_type : undefined;
    const credentials = parseClientCredentials(
      req.header("authorization"),
      req.body as Record<string, unknown>
    );
    const clientId = credentials.clientId;

    if (!grantType || !clientId) {
      res.status(400).json({
        error: "invalid_request",
        error_description: "grant_type and client_id are required",
      });
      return;
    }

    const client = clients.get(clientId);
    if (!client) {
      res.status(401).json({
        error: "invalid_client",
        error_description: "Unknown client",
      });
      return;
    }

    if (client.tokenEndpointAuthMethod !== "none") {
      if (!client.clientSecret || credentials.clientSecret !== client.clientSecret) {
        res.status(401).json({
          error: "invalid_client",
          error_description: "Invalid client credentials",
        });
        return;
      }
    }

    if (grantType === "authorization_code") {
      const code = typeof req.body.code === "string" ? req.body.code : undefined;
      const redirectUri =
        typeof req.body.redirect_uri === "string"
          ? req.body.redirect_uri
          : undefined;
      const codeVerifier =
        typeof req.body.code_verifier === "string"
          ? req.body.code_verifier
          : undefined;

      if (!code || !redirectUri || !codeVerifier) {
        res.status(400).json({
          error: "invalid_request",
          error_description: "code, redirect_uri, and code_verifier are required",
        });
        return;
      }

      const authCode = authorizationCodes.get(code);
      if (
        !authCode ||
        authCode.clientId !== clientId ||
        authCode.redirectUri !== redirectUri ||
        authCode.expiresAt < Date.now()
      ) {
        res.status(400).json({
          error: "invalid_grant",
          error_description: "Authorization code is invalid or expired",
        });
        return;
      }

      if (buildPkceChallenge(codeVerifier) !== authCode.codeChallenge) {
        res.status(400).json({
          error: "invalid_grant",
          error_description: "PKCE verification failed",
        });
        return;
      }

      authorizationCodes.delete(code);
      const issued = await issueAccessToken(
        privateKey,
        clientId,
        authCode.scopes,
        authCode.user,
        resolveAudience(req.body.resource ?? req.body.audience ?? authCode.audience)
      );

      res.json({
        access_token: issued.token,
        token_type: "Bearer",
        expires_in: ACCESS_TOKEN_TTL_SECONDS,
        refresh_token: issued.refreshToken,
        scope: authCode.scopes.join(" "),
      });
      return;
    }

    if (grantType === "refresh_token") {
      const refreshToken =
        typeof req.body.refresh_token === "string"
          ? req.body.refresh_token
          : undefined;

      if (!refreshToken) {
        res.status(400).json({
          error: "invalid_request",
          error_description: "refresh_token is required",
        });
        return;
      }

      const record = refreshTokens.get(refreshToken);
      if (
        !record ||
        record.clientId !== clientId ||
        record.revoked ||
        record.expiresAt < Math.floor(Date.now() / 1000)
      ) {
        res.status(400).json({
          error: "invalid_grant",
          error_description: "Refresh token is invalid or expired",
        });
        return;
      }

      record.revoked = true;
      const issued = await issueAccessToken(
        privateKey,
        clientId,
        record.scopes,
        record.user,
        resolveAudience(req.body.resource ?? req.body.audience ?? record.audience)
      );

      res.json({
        access_token: issued.token,
        token_type: "Bearer",
        expires_in: ACCESS_TOKEN_TTL_SECONDS,
        refresh_token: issued.refreshToken,
        scope: record.scopes.join(" "),
      });
      return;
    }

    res.status(400).json({
      error: "unsupported_grant_type",
      error_description: `Unsupported grant_type: ${grantType}`,
    });
  });

  app.post("/introspect", async (req, res) => {
    const credentials = parseClientCredentials(
      req.header("authorization"),
      req.body as Record<string, unknown>
    );
    const client = credentials.clientId
      ? clients.get(credentials.clientId)
      : undefined;

    if (
      !client ||
      !client.clientSecret ||
      credentials.clientSecret !== client.clientSecret
    ) {
      res.status(401).json({
        error: "invalid_client",
        error_description: "Invalid client credentials",
      });
      return;
    }

    const token = typeof req.body.token === "string" ? req.body.token : undefined;

    if (!token) {
      res.status(400).json({
        error: "invalid_request",
        error_description: "token is required",
      });
      return;
    }

    const record = accessTokens.get(token);
    if (!record || record.revoked || record.expiresAt < Math.floor(Date.now() / 1000)) {
      res.json({ active: false });
      return;
    }

    try {
      await jwtVerify(token, publicKey, {
        issuer: PROVIDER_BASE_URL,
        audience: record.audience,
      });
    } catch {
      res.json({ active: false });
      return;
    }

    res.json({
      active: true,
      client_id: record.clientId,
      scope: record.scopes.join(" "),
      exp: record.expiresAt,
      sub: record.user.sub,
      email: record.user.email,
      name: record.user.name,
      organization: record.user.organization,
      aud: record.audience,
      iss: PROVIDER_BASE_URL,
      token_type: "Bearer",
    });
  });

  app.post("/revoke", (req, res) => {
    const token = typeof req.body.token === "string" ? req.body.token : undefined;

    if (!token) {
      res.status(400).json({
        error: "invalid_request",
        error_description: "token is required",
      });
      return;
    }

    const accessToken = accessTokens.get(token);
    if (accessToken) {
      accessToken.revoked = true;
    }

    const refreshToken = refreshTokens.get(token);
    if (refreshToken) {
      refreshToken.revoked = true;
    }

    res.status(200).end();
  });

  app.listen(PROVIDER_PORT, "127.0.0.1", () => {
    console.log(
      `Local OAuth provider listening on ${PROVIDER_BASE_URL} for ${RESOURCE_SERVER_BASE_URL}`
    );
  });
}

void start();
