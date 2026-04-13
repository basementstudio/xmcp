import { type Middleware } from "xmcp";

const PROVIDER_BASE_URL = "http://127.0.0.1:4405";
const INTROSPECTION_CLIENT_ID = "resource-server";
const INTROSPECTION_CLIENT_SECRET = "resource-server-secret";

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

const middleware: Middleware = async (req, res, next) => {
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
    const response = await fetch(`${PROVIDER_BASE_URL}/introspect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${INTROSPECTION_CLIENT_ID}:${INTROSPECTION_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({ token }),
    });

    if (!response.ok) {
      res.status(401).json({ error: "Introspection failed" });
      return;
    }

    const payload = (await response.json()) as {
      active?: boolean;
      client_id?: string;
      scope?: string;
      exp?: number;
      sub?: string;
      email?: string;
      iss?: string;
      aud?: string;
    };

    if (!payload.active || !payload.client_id) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    const authInfo: DemoAuthInfo = {
      token,
      clientId: payload.client_id,
      scopes:
        typeof payload.scope === "string"
          ? payload.scope.split(" ").filter(Boolean)
          : [],
      expiresAt: payload.exp ?? Math.floor(Date.now() / 1000),
      extra: {
        source: "custom-middleware",
        userId: payload.sub ?? "unknown-user",
        sub: payload.sub,
        name:
          typeof (payload as Record<string, unknown>).name === "string"
            ? ((payload as Record<string, unknown>).name as string)
            : undefined,
        email: payload.email,
        organization:
          typeof (payload as Record<string, unknown>).organization === "string"
            ? ((payload as Record<string, unknown>).organization as string)
            : undefined,
        issuer: payload.iss,
        audience: payload.aud,
      },
    };

    (req as typeof req & { auth?: DemoAuthInfo }).auth = authInfo;
    next();
  } catch {
    res.status(401).json({ error: "Unable to verify token" });
    return;
  }
};

export default middleware;
