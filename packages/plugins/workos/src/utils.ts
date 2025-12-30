import { jwtVerify, createRemoteJWKSet } from "jose";
import type { JWTPayload } from "./types.js";

/**
 * Extract Bearer token from Authorization header
 */
export function extractBearerToken(
  authHeader: string | undefined
): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return null;
  }

  return parts[1];
}

/**
 * Construct the AuthKit base URL from the domain
 */
export function getAuthKitBaseUrl(authkitDomain: string): string {
  return `https://${authkitDomain}`;
}

/**
 * Verify an access token using WorkOS JWKS.
 *
 * This function properly validates the JWT by:
 * - Verifying the signature using WorkOS's JWKS
 * - Checking the issuer (iss) matches the AuthKit domain
 * - Checking the audience (aud) matches the client ID
 * - Automatically validating expiration (exp)
 *
 * Note: No caching is used to ensure serverless compatibility.
 * The jose library handles HTTP caching headers from the JWKS endpoint.
 *
 * @param token - The JWT access token to verify
 * @param authkitDomain - The AuthKit domain (e.g., "yourcompany.authkit.app")
 * @param clientId - The WorkOS client ID for audience validation
 * @returns The verified JWT payload, or null if verification fails
 */
export async function verifyAccessToken(
  token: string,
  authkitDomain: string,
  clientId: string
): Promise<JWTPayload | null> {
  try {
    const JWKS = createRemoteJWKSet(new URL(`${getAuthKitBaseUrl(authkitDomain)}/oauth2/jwks`));
    const issuer = getAuthKitBaseUrl(authkitDomain);

    const { payload } = await jwtVerify(token, JWKS, {
      issuer,
      audience: clientId,
    });

    return payload as JWTPayload;
  } catch {
    // Token verification failed (invalid signature, expired, wrong issuer/audience, etc.)
    return null;
  }
}
