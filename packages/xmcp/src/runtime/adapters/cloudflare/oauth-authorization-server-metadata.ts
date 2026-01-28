/**
 * OAuth Authorization Server Metadata endpoint handler.
 * Proxies the OpenID configuration from the configured authorization server.
 */

import type { Env } from "./types";
import { addCorsHeaders } from "./cors";
import { getOAuthConfig } from "./auth/config";

/**
 * OAuth Authorization Server Metadata response type.
 */
interface OAuthAuthorizationServerMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  response_types_supported?: string[];
  grant_types_supported?: string[];
  code_challenge_methods_supported?: string[];
  token_endpoint_auth_methods_supported?: string[];
  [key: string]: unknown;
}

/**
 * Handle OAuth Authorization Server Metadata endpoint.
 * Fetches and returns the OpenID configuration from the configured authorization server.
 * This endpoint is required for OAuth clients to discover authorization and token endpoints.
 */
export async function handleAuthorizationServerMetadata(
  request: Request,
  env: Env,
  requestOrigin: string | null
): Promise<Response> {
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

  // Fetch from the first authorization server's OpenID configuration
  const authServer = oauthConfig.authorizationServers[0];
  const metadataUrl = `${authServer.replace(/\/$/, "")}/.well-known/openid-configuration`;

  try {
    const response = await fetch(metadataUrl);
    if (response.ok) {
      const data = (await response.json()) as OAuthAuthorizationServerMetadata;
      return addCorsHeaders(
        new Response(JSON.stringify(data, null, 2), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=3600",
          },
        }),
        requestOrigin
      );
    }
  } catch (error) {
    console.error("[Cloudflare-MCP] Failed to fetch OAuth metadata:", error);
  }

  // Fallback: construct basic metadata
  const authServerUrl = authServer.replace(/\/$/, "");
  const fallbackMetadata: OAuthAuthorizationServerMetadata = {
    issuer: oauthConfig.issuer,
    authorization_endpoint: `${authServerUrl}/oauth2/authorize`,
    token_endpoint: `${authServerUrl}/oauth2/token`,
    jwks_uri:
      oauthConfig.jwksUri ||
      `${oauthConfig.issuer.replace(/\/$/, "")}/.well-known/jwks.json`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none", "client_secret_post"],
  };

  return addCorsHeaders(
    new Response(JSON.stringify(fallbackMetadata, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    }),
    requestOrigin
  );
}
