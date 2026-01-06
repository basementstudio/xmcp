import type { ClerkJWTClaims, ClerkSession } from "./types.js";

/** Clerk's OAuth token verification endpoint */
const CLERK_VERIFY_ENDPOINT =
  "https://api.clerk.com/oauth_applications/access_tokens/verify";

/** Result of JWT verification */
export type JWTVerifyResult =
  | { readonly ok: true; readonly claims: ClerkJWTClaims }
  | { readonly ok: false; readonly error: "expired" | "invalid" };

/** Response from Clerk's token verification API */
interface ClerkVerifyResponse {
  readonly object: string;
  readonly token: string;
  readonly status: string;
  readonly scopes: string[];
  readonly user_id: string;
  readonly client_id?: string;
  readonly created_at?: number;
  readonly expires_at?: number;
}

/**
 * Get the Clerk Frontend API URL from the configured domain.
 * @param clerkDomain - The Clerk Frontend API domain (e.g., your-app.clerk.accounts.dev)
 */
export function getClerkIssuer(clerkDomain: string): string {
  // Remove any protocol prefix if provided
  const domain = clerkDomain.replace(/^https?:\/\//, "");
  return `https://${domain}`;
}

/**
 * Verify a Clerk OAuth token using Clerk's REST API.
 * MCP OAuth tokens are opaque and cannot be verified via JWKS.
 */
export async function verifyClerkToken(
  token: string,
  secretKey: string
): Promise<JWTVerifyResult> {
  try {
    const response = await fetch(CLERK_VERIFY_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ access_token: token }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[Clerk] Token verification failed:", response.status, errorData);

      // Check for expired token
      if (
        response.status === 401 ||
        (errorData as any)?.errors?.[0]?.code === "token_expired"
      ) {
        return { ok: false, error: "expired" };
      }

      return { ok: false, error: "invalid" };
    }

    const data = (await response.json()) as any;

    // Try different possible field names for user ID
    const userId: string | undefined = data.user_id || data.sub || data.subject;
    if (!userId) {
      console.error("[Clerk] Missing user_id in verification response");
      return { ok: false, error: "invalid" };
    }

    // Map the API response to ClerkJWTClaims
    const claims: ClerkJWTClaims = {
      sub: userId,
      azp: data.client_id,
      iss: "https://clerk.com",
      exp: data.expires_at ?? Math.floor(Date.now() / 1000) + 3600,
      iat: data.created_at ?? Math.floor(Date.now() / 1000),
    };

    return { ok: true, claims };
  } catch (error) {
    console.error("[Clerk] Token verification error:", error);
    return { ok: false, error: "invalid" };
  }
}

export function claimsToSession(claims: ClerkJWTClaims): ClerkSession {
  return {
    userId: claims.sub,
    sessionId: claims.sid,
    organizationId: claims.org_id,
    organizationRole: claims.org_role,
    organizationPermissions: claims.org_permissions,
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
