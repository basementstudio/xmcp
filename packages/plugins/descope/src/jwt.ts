import type { AuthenticationInfo } from "@descope/node-sdk";
import type { DescopeClient } from "./context.js";
import type { DescopeSession, DescopeTenant, TokenVerifyResult } from "./types.js";

export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  return token.length > 0 ? token : null;
}

export function claimsToSession(token: string, authInfo: AuthenticationInfo): DescopeSession {
  const { token: claims } = authInfo;
  const loginIds = Array.isArray(claims["loginIds"]) ? (claims["loginIds"] as string[]) : [];
  const rawTenants = claims["tenants"] as Record<string, unknown> | undefined;
  const tenants: Record<string, DescopeTenant> = {};
  if (rawTenants) {
    for (const [id, val] of Object.entries(rawTenants)) {
      const t = val as Record<string, unknown>;
      tenants[id] = {
        permissions: Array.isArray(t["permissions"]) ? (t["permissions"] as string[]) : undefined,
        roles: Array.isArray(t["roles"]) ? (t["roles"] as string[]) : undefined,
      };
    }
  }
  return {
    userId: claims.sub ?? "",
    email: typeof claims.email === "string" ? claims.email : "",
    token,
    loginIds,
    tenants,
    permissions: Array.isArray(claims["permissions"]) ? (claims["permissions"] as string[]) : [],
    roles: Array.isArray(claims["roles"]) ? (claims["roles"] as string[]) : [],
    expiresAt: new Date((claims.exp as number) * 1000),
    issuedAt: new Date((claims.iat as number) * 1000),
    claims: claims as Record<string, unknown>,
  };
}

export async function validateToken(
  sdk: DescopeClient,
  token: string,
): Promise<TokenVerifyResult> {
  try {
    const authInfo = await sdk.validateJwt(token);
    return { ok: true, session: claimsToSession(token, authInfo) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const isExpired = message.toLowerCase().includes("expired");
    return {
      ok: false,
      error: isExpired ? "expired" : "invalid",
      message,
    };
  }
}
