import type { JWTPayload, JWTVerifyOptions } from "jose";
import { decodeProtectedHeader, importJWK, importSPKI, importX509, jwtVerify } from "jose";
import type { WebMiddleware } from "@/types/middleware";

export type CloudflareJWTAuthMiddlewareConfig = {
  secret: string;
  algorithms?: string[];
  audience?: string | string[];
  issuer?: string;
  subject?: string;
  clockTolerance?: number | string;
  maxAge?: string | number;
};

export function cloudflareJwtAuthMiddleware(
  config: CloudflareJWTAuthMiddlewareConfig
): WebMiddleware {
  return async (request) => {
    const authHeader = request.headers.get("authorization");
    const token = extractBearerToken(authHeader);
    if (!token) {
      return jsonUnauthorized(
        "Unauthorized: Missing or malformed Authorization header"
      );
    }

    try {
      await verifyJwt(token, config);
      return;
    } catch {
      return jsonUnauthorized("Unauthorized: Invalid or expired token");
    }
  };
}

function extractBearerToken(authHeader: string | null | undefined): string | null {
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(" ");
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
    return null;
  }
  return token.trim() || null;
}

function jsonUnauthorized(message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

async function verifyJwt(
  token: string,
  config: CloudflareJWTAuthMiddlewareConfig
): Promise<JWTPayload> {
  const { secret, ...verifyOptions } = config;
  const header = decodeProtectedHeader(token);
  const alg =
    verifyOptions.algorithms?.[0] ??
    (typeof header.alg === "string" ? header.alg : undefined);

  if (!alg) {
    throw new Error("Missing JWT algorithm");
  }

  const key = await resolveJoseKey(secret, alg);
  const joseOptions = mapJoseVerifyOptions(verifyOptions);
  const { payload } = await jwtVerify(token, key as any, joseOptions);
  return payload;
}

async function resolveJoseKey(
  secret: string,
  alg: string
): Promise<Uint8Array | unknown> {
  const trimmed = secret.trim();

  if (trimmed.startsWith("{")) {
    try {
      const jwk = JSON.parse(trimmed);
      return await importJWK(jwk, alg);
    } catch {
      return new TextEncoder().encode(secret);
    }
  }

  if (trimmed.includes("BEGIN CERTIFICATE")) {
    return await importX509(trimmed, alg);
  }

  if (trimmed.includes("BEGIN PUBLIC KEY")) {
    return await importSPKI(trimmed, alg);
  }

  return new TextEncoder().encode(secret);
}

function mapJoseVerifyOptions(
  verifyOptions: Omit<CloudflareJWTAuthMiddlewareConfig, "secret">
): JWTVerifyOptions {
  const joseOptions: JWTVerifyOptions = {};

  if (verifyOptions.algorithms) {
    joseOptions.algorithms = verifyOptions.algorithms;
  }
  if (verifyOptions.audience) {
    if (typeof verifyOptions.audience === "string") {
      joseOptions.audience = verifyOptions.audience;
    } else if (Array.isArray(verifyOptions.audience)) {
      joseOptions.audience = verifyOptions.audience;
    }
  }
  if (verifyOptions.issuer) {
    joseOptions.issuer = verifyOptions.issuer;
  }
  if (verifyOptions.subject) {
    joseOptions.subject = verifyOptions.subject;
  }
  if (verifyOptions.clockTolerance !== undefined) {
    joseOptions.clockTolerance = verifyOptions.clockTolerance;
  }
  if (verifyOptions.maxAge !== undefined) {
    joseOptions.maxTokenAge = verifyOptions.maxAge;
  }

  return joseOptions;
}
