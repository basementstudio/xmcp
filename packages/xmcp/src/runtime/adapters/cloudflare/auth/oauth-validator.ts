/**
 * OAuth JWT validation for Cloudflare Workers adapter.
 */

import type { Env } from "../types";
import type { OAuthAuthInfo } from "./types";
import { addCorsHeaders } from "../cors";
import { getOAuthConfig } from "./config";
import { createUnauthorizedResponse, createForbiddenResponse } from "./responses";
import { verifyJWT, JWTVerificationError } from "./jwt";

// HTTP config - injected by compiler
// @ts-expect-error: injected by compiler
const httpConfig = HTTP_CONFIG as {
  debug: boolean;
};

const { debug } = httpConfig;

/**
 * Log a message if debug mode is enabled
 */
function log(message: string, ...args: unknown[]): void {
  if (debug) {
    console.log(`[Cloudflare-MCP] ${message}`, ...args);
  }
}

/**
 * Validate OAuth JWT token.
 * Returns auth info if valid, null if no OAuth configured, or error Response if invalid.
 */
export async function validateOAuth(
  request: Request,
  env: Env,
  requestOrigin: string | null
): Promise<{ authInfo: OAuthAuthInfo | null } | { error: Response }> {
  const oauthConfig = getOAuthConfig(env);
  if (!oauthConfig) {
    return { authInfo: null }; // No OAuth configured
  }

  const baseUrl = new URL(request.url).origin;
  const requiredScopes = oauthConfig.requiredScopes;

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    // No Bearer token provided
    if (oauthConfig.required !== false) {
      return {
        error: createUnauthorizedResponse(
          "Missing Bearer token",
          requestOrigin,
          baseUrl,
          requiredScopes
        ),
      };
    }
    return { authInfo: null };
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verifyJWT(token, {
      issuer: oauthConfig.issuer,
      audience: oauthConfig.audience,
      jwksUri: oauthConfig.jwksUri,
    });

    // Check required scopes
    const tokenScopes = (payload.scope as string)?.split(" ") || [];
    if (requiredScopes?.length) {
      const hasRequiredScopes = requiredScopes.every((s) =>
        tokenScopes.includes(s)
      );
      if (!hasRequiredScopes) {
        return {
          error: createForbiddenResponse(
            `Insufficient scope. Required: ${requiredScopes.join(", ")}`,
            requestOrigin,
            baseUrl,
            requiredScopes
          ),
        };
      }
    }

    // Build OAuthAuthInfo
    const authInfo: OAuthAuthInfo = {
      token,
      clientId: ((payload.azp || payload.client_id || payload.sub) as string) || "unknown",
      scopes: tokenScopes,
      expiresAt: payload.exp,
      extra: {
        sub: payload.sub,
        email: payload.email as string | undefined,
        name: payload.name as string | undefined,
        ...payload,
      },
    };

    return { authInfo };
  } catch (error) {
    if (error instanceof JWTVerificationError) {
      log(`JWT verification failed: ${error.code} - ${error.message}`);
      return {
        error: createUnauthorizedResponse(
          error.message,
          requestOrigin,
          baseUrl,
          requiredScopes
        ),
      };
    }

    // Handle jose not installed
    if (
      error instanceof Error &&
      error.name === "JoseNotInstalledError"
    ) {
      console.error("[Cloudflare-MCP]", error.message);
      return {
        error: addCorsHeaders(
          new Response(
            JSON.stringify({
              jsonrpc: "2.0",
              error: {
                code: -32603,
                message: "OAuth is configured but jose library is not installed",
              },
              id: null,
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          ),
          requestOrigin
        ),
      };
    }

    log("JWT verification failed:", error);
    return {
      error: createUnauthorizedResponse(
        "Invalid token",
        requestOrigin,
        baseUrl,
        requiredScopes
      ),
    };
  }
}
