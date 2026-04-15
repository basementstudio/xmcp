import { type Middleware } from "xmcp";
import { createRemoteJWKSet, errors, jwtVerify } from "jose";

export const PROVIDER_BASE_URL = "http://127.0.0.1:4405";
export const RESOURCE_SERVER_BASE_URL = "http://127.0.0.1:3005";
export const RESOURCE_URL = `${RESOURCE_SERVER_BASE_URL}/mcp`;

const JWKS = createRemoteJWKSet(
  new URL(`${PROVIDER_BASE_URL}/.well-known/jwks.json`)
);

type DemoAuthInfo = {
  token: string;
  clientId: string;
  scopes: string[];
  expiresAt: number;
  extra: {
    source: string;
    userId: string;
    sub?: string;
    name?: string;
    email?: string;
    organization?: string;
    issuer?: string;
    audience?: string;
  };
};

type VerifiedPayload = {
  client_id?: string;
  scope?: string;
  exp?: number;
  sub?: string;
  name?: string;
  email?: string;
  organization?: string;
  iss?: string;
  aud?: string;
};

function toAuthInfo(token: string, payload: VerifiedPayload): DemoAuthInfo {
  return {
    token,
    clientId: payload.client_id!,
    scopes:
      typeof payload.scope === "string"
        ? payload.scope.split(" ").filter(Boolean)
        : [],
    expiresAt: payload.exp ?? Math.floor(Date.now() / 1000),
    extra: {
      source: "custom-middleware",
      userId: payload.sub ?? "unknown-user",
      sub: payload.sub,
      name: payload.name,
      email: payload.email,
      organization: payload.organization,
      issuer: payload.iss,
      audience: payload.aud,
    },
  };
}

export const customJwtMiddleware: Middleware = async (req, res, next) => {
  if (!req.path.startsWith("/mcp")) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or malformed Authorization header" });
    return;
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: PROVIDER_BASE_URL,
      audience: RESOURCE_URL,
      clockTolerance: 30,
    });

    const verifiedPayload = payload as VerifiedPayload;

    if (!verifiedPayload.client_id) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    (req as typeof req & { auth?: DemoAuthInfo }).auth = toAuthInfo(
      token,
      verifiedPayload
    );
    next();
  } catch (error) {
    if (error instanceof errors.JWTExpired) {
      res.status(401).json({ error: "Token has expired" });
      return;
    }

    res.status(401).json({ error: "Unable to verify token" });
  }
};
