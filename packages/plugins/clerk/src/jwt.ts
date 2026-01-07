import type { JWTClaims, Session, TokenVerifyResult } from "./types.js";

const CLERK_VERIFY_ENDPOINT = "https://api.clerk.com/oauth_applications/access_tokens/verify";
const ONE_HOUR_IN_SECONDS = 3600;

export function getIssuer(clerkDomain: string): string {
  const domain = clerkDomain.replace(/^https?:\/\//, "");
  return `https://${domain}`;
}

export async function verifyToken(
  token: string,
  secretKey: string
): Promise<TokenVerifyResult> {
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

      if (
        response.status === 401 ||
        (errorData as any)?.errors?.[0]?.code === "token_expired"
      ) {
        return { ok: false, error: "expired" };
      }

      return { ok: false, error: "invalid" };
    }

    const data = (await response.json()) as any;

    const userId: string | undefined = data.user_id || data.sub || data.subject;
    if (!userId) {
      console.error("[Clerk] Missing user_id in verification response");
      return { ok: false, error: "invalid" };
    }

    const now = Math.floor(Date.now() / 1000);

    const claims: JWTClaims = {
      sub: userId,
      sid: data.sid || data.session_id,
      org_id: data.org_id || data.organization_id,
      org_role: data.org_role || data.organization_role,
      org_permissions: data.org_permissions || data.organization_permissions,
      azp: data.client_id,
      iss: "https://clerk.com",
      exp: data.expires_at ?? now + ONE_HOUR_IN_SECONDS,
      iat: data.created_at ?? now,
    };

    return { ok: true, claims };
  } catch (error) {
    console.error("[Clerk] Token verification error:", error);
    return { ok: false, error: "invalid" };
  }
}

export function claimsToSession(claims: JWTClaims): Session {
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
