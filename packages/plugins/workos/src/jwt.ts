import { createRemoteJWKSet, jwtVerify, errors } from "jose";
import type { WorkOSJWTClaims, WorkOSSession } from "./types.js";
import { getAuthKitBaseUrl } from "./utils.js";

/** Result of JWT verification */
export type JWTVerifyResult =
  | { readonly ok: true; readonly claims: WorkOSJWTClaims }
  | { readonly ok: false; readonly error: "expired" | "invalid" };

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getJWKS(authkitDomain: string): ReturnType<typeof createRemoteJWKSet> {
  if (!jwksCache.has(authkitDomain)) {
    const jwksUri = new URL(`${getAuthKitBaseUrl(authkitDomain)}/oauth2/jwks`);
    jwksCache.set(authkitDomain, createRemoteJWKSet(jwksUri));
  }
  return jwksCache.get(authkitDomain)!;
}

export async function verifyWorkOSToken(
  token: string,
  authkitDomain: string
): Promise<JWTVerifyResult> {
  try {
    const JWKS = getJWKS(authkitDomain);
    const issuer = getAuthKitBaseUrl(authkitDomain);

    const { payload } = await jwtVerify(token, JWKS, {
      issuer,
      clockTolerance: 30, // Allow 30 seconds of clock skew
    });

    if (!payload.sub || !payload.sid) {
      console.error("[WorkOS] Missing required JWT claims (sub or sid)");
      return { ok: false, error: "invalid" };
    }

    return { ok: true, claims: payload as unknown as WorkOSJWTClaims };
  } catch (error) {
    // Check if the error is specifically a JWT expired error
    if (error instanceof errors.JWTExpired) {
      console.warn("[WorkOS] JWT has expired");
      return { ok: false, error: "expired" };
    }

    console.error("[WorkOS] JWT verification failed:", error);
    return { ok: false, error: "invalid" };
  }
}

export function claimsToSession(claims: WorkOSJWTClaims): WorkOSSession {
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
