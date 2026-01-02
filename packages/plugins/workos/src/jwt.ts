import { createRemoteJWKSet, jwtVerify } from "jose";
import type { WorkOSJWTClaims, WorkOSSession } from "./types.js";

// Cache the JWKS to avoid repeated fetches
const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

/**
 * Get or create a cached JWKS for the given AuthKit domain
 */
function getJWKS(authkitDomain: string) {
  if (!jwksCache.has(authkitDomain)) {
    const jwksUri = new URL(`https://${authkitDomain}/oauth2/jwks`);
    jwksCache.set(authkitDomain, createRemoteJWKSet(jwksUri));
  }
  return jwksCache.get(authkitDomain)!;
}

/**
 * Verify a WorkOS AuthKit JWT token
 * @param token - The JWT token to verify
 * @param authkitDomain - The AuthKit domain (e.g., balanced-farm-35-staging.authkit.app)
 * @returns The verified JWT claims or null if invalid
 */
export async function verifyWorkOSToken(
  token: string,
  authkitDomain: string
): Promise<WorkOSJWTClaims | null> {
  try {
    const JWKS = getJWKS(authkitDomain);
    const issuer = `https://${authkitDomain}`;

    const { payload } = await jwtVerify(token, JWKS, {
      issuer,
    });

    // Validate required claims exist
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

/**
 * Convert JWT claims to a WorkOS session object
 */
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

/**
 * Extract bearer token from Authorization header
 */
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
