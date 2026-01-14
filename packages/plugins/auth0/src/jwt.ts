import { ApiClient, VerifyAccessTokenError } from "@auth0/auth0-api-js";
import type { AuthInfo, Auth0Config, TokenVerifyResult } from "./types.js";

export function createVerifier(
  config: Auth0Config
): (token: string) => Promise<TokenVerifyResult> {
  const apiClient = new ApiClient({
    domain: config.domain,
    audience: config.audience,
  });

  return async function verify(token: string): Promise<TokenVerifyResult> {
    try {
      const decoded = await apiClient.verifyAccessToken({
        accessToken: token,
      });

      if (!isNonEmptyString(decoded.sub)) {
        return {
          ok: false,
          error: "invalid",
          message: "Token is missing required subject (sub) claim",
        };
      }

      let clientId: string | null = null;
      if (isNonEmptyString(decoded.client_id)) {
        clientId = decoded.client_id;
      } else if (isNonEmptyString(decoded.azp)) {
        clientId = decoded.azp;
      }

      if (!clientId) {
        return {
          ok: false,
          error: "invalid",
          message:
            "Token is missing required client identification (client_id or azp claim)",
        };
      }

      const scopes =
        typeof decoded.scope === "string"
          ? decoded.scope.split(" ").filter(Boolean)
          : [];

      const permissions = Array.isArray(
        (decoded as Record<string, unknown>).permissions
      )
        ? (
            (decoded as Record<string, unknown>).permissions as unknown[]
          ).filter((p): p is string => typeof p === "string" && p.length > 0)
        : [];

      const uniqueScopes = Array.from(new Set([...scopes, ...permissions]));

      const authInfo: AuthInfo = {
        token,
        clientId,
        scopes: uniqueScopes,
        ...(permissions.length > 0 && { permissions }),
        ...(decoded.exp && { expiresAt: decoded.exp }),
        user: {
          sub: decoded.sub,
          ...(isNonEmptyString(decoded.client_id) && {
            client_id: decoded.client_id,
          }),
          ...(isNonEmptyString(decoded.azp) && { azp: decoded.azp }),
          ...(isNonEmptyString(decoded.name) && { name: decoded.name }),
          ...(isNonEmptyString(decoded.email) && { email: decoded.email }),
        },
      };

      return { ok: true, authInfo };
    } catch (error) {
      if (error instanceof VerifyAccessTokenError) {
        const isExpired = error.message.toLowerCase().includes("expired");
        return {
          ok: false,
          error: isExpired ? "expired" : "invalid",
          message: error.message,
        };
      }

      return {
        ok: false,
        error: "invalid",
        message:
          error instanceof Error ? error.message : "Unknown verification error",
      };
    }
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export function extractBearerToken(
  authHeader: string | undefined
): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0]?.toLowerCase() !== "bearer") {
    return null;
  }

  return parts[1] ?? null;
}
