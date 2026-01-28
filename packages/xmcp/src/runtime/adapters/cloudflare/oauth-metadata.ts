/**
 * OAuth Protected Resource Metadata endpoint handler (RFC 9728).
 */

import type { Env } from "./types";
import type { OAuthProtectedResourceMetadata } from "./auth/types";
import { addCorsHeaders } from "./cors";
import { getOAuthConfig } from "./auth/config";

/**
 * Handle OAuth Protected Resource Metadata endpoint (RFC 9728).
 * Returns metadata describing how to authenticate with this resource.
 */
export function handleProtectedResourceMetadata(
  request: Request,
  env: Env,
  requestOrigin: string | null
): Response {
  const oauthConfig = getOAuthConfig(env);

  if (!oauthConfig) {
    return addCorsHeaders(
      new Response(
        JSON.stringify({
          error: "OAuth not configured",
          hint: "Set MCP_OAUTH_ISSUER and MCP_OAUTH_AUDIENCE environment variables",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      ),
      requestOrigin
    );
  }

  const baseUrl = new URL(request.url).origin;

  const metadata: OAuthProtectedResourceMetadata = {
    resource: baseUrl,
    authorization_servers: oauthConfig.authorizationServers,
    bearer_methods_supported: ["header"],
    // Only include scopes_supported when explicitly configured
    ...(oauthConfig.requiredScopes?.length && {
      scopes_supported: oauthConfig.requiredScopes,
    }),
  };

  return addCorsHeaders(
    new Response(JSON.stringify(metadata, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    }),
    requestOrigin
  );
}
