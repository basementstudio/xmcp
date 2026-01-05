import { createRemoteJWKSet, jwtVerify } from "jose";
import type { WorkOSJWTClaims, WorkOSSession } from "./types.js";
import { getAuthKitBaseUrl } from "./utils.js";

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getJWKS(authkitDomain: string) {
  if (!jwksCache.has(authkitDomain)) {
    const jwksUri = new URL(`${getAuthKitBaseUrl(authkitDomain)}/oauth2/jwks`);
    jwksCache.set(authkitDomain, createRemoteJWKSet(jwksUri));
  }
  return jwksCache.get(authkitDomain)!;
}

export async function verifyWorkOSToken(
  token: string,
  authkitDomain: string
): Promise<WorkOSJWTClaims | null> {
  try {
    const JWKS = getJWKS(authkitDomain);
    const issuer = getAuthKitBaseUrl(authkitDomain);

    const { payload } = await jwtVerify(token, JWKS, {
      issuer,
    });

    if (!payload.sub || !payload.sid) {
      console.error("[WorkOS] Missing required JWT claims (sub or sid)");
      return null;
    }

    return payload as unknown as WorkOSJWTClaims;
  } catch (error) {
    console.error("[WorkOS] JWT verification failed:", error);
    return null;
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
