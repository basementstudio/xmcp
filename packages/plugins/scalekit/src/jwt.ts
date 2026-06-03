import { createRemoteJWKSet, jwtVerify, errors } from "jose";
import type { JWTClaims, Session } from "./types.js";

export type TokenVerifyResult =
  | { readonly ok: true; readonly claims: JWTClaims }
  | { readonly ok: false; readonly error: "expired" | "invalid" };

export async function verifyScalekitToken(
  token: string,
  jwksUrl: URL,
  issuer: string,
  audience?: string
): Promise<TokenVerifyResult> {
  try {
    const JWKS = createRemoteJWKSet(jwksUrl);

    const verifyOptions: Record<string, unknown> = {
      issuer,
      clockTolerance: 30,
    };
    if (audience) {
      verifyOptions.audience = audience;
    }

    const { payload } = await jwtVerify(token, JWKS, verifyOptions);

    if (!payload.sub) {
      console.error("[Scalekit] Missing required JWT claim: sub");
      return { ok: false, error: "invalid" };
    }

    return { ok: true, claims: payload as unknown as JWTClaims };
  } catch (error) {
    if (error instanceof errors.JWTExpired) {
      console.warn("[Scalekit] JWT has expired");
      return { ok: false, error: "expired" };
    }

    console.error("[Scalekit] JWT verification failed:", error);
    return { ok: false, error: "invalid" };
  }
}

export function claimsToSession(claims: JWTClaims): Session {
  const scopes = claims.scope ? claims.scope.split(" ") : [];
  return {
    userId: claims.sub,
    scopes,
    organizationId: claims.org_id,
    expiresAt: new Date(claims.exp * 1000),
    issuedAt: new Date(claims.iat * 1000),
    claims,
  };
}

export function extractBearerToken(
  authHeader: string | undefined
): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return null;
  }

  return parts[1];
}