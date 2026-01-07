import { createRemoteJWKSet, jwtVerify, errors } from "jose";
import type { JWTClaims, Session } from "./types.js";
import { getAuthKitBaseUrl } from "./utils.js";

export type TokenVerifyResult =
  | { readonly ok: true; readonly claims: JWTClaims }
  | { readonly ok: false; readonly error: "expired" | "invalid" };

export async function verifyWorkOSToken(
  token: string,
  authkitDomain: string
): Promise<TokenVerifyResult> {
  try {
    const issuer = getAuthKitBaseUrl(authkitDomain);
    const jwksUri = new URL(`${issuer}/oauth2/jwks`);
    const JWKS = createRemoteJWKSet(jwksUri);

    const { payload } = await jwtVerify(token, JWKS, {
      issuer,
      clockTolerance: 30,
    });

    if (!payload.sub || !payload.sid) {
      console.error("[WorkOS] Missing required JWT claims (sub or sid)");
      return { ok: false, error: "invalid" };
    }

    return { ok: true, claims: payload as unknown as JWTClaims };
  } catch (error) {
    if (error instanceof errors.JWTExpired) {
      console.warn("[WorkOS] JWT has expired");
      return { ok: false, error: "expired" };
    }

    console.error("[WorkOS] JWT verification failed:", error);
    return { ok: false, error: "invalid" };
  }
}

export function claimsToSession(claims: JWTClaims): Session {
  return {
    userId: claims.sub,
    sessionId: claims.sid,
    organizationId: claims.org_id,
    role: claims.role,
    permissions: claims.permissions,
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
