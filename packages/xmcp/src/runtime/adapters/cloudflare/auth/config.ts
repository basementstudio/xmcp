/**
 * OAuth configuration parsing and validation for Cloudflare Workers adapter.
 */

import { z } from "zod/v3";
import type { CloudflareOAuthConfig } from "./types";
import type { Env } from "../types";

export const OAuthConfigSchema = z.object({
  provider: z.enum(["auth0", "workos", "clerk", "custom"]).optional(),
  issuer: z.string().url(),
  audience: z.string().min(1),
  jwksUri: z.string().url().optional(),
  requiredScopes: z.array(z.string()).optional(),
  required: z.boolean().optional(),
  authorizationServers: z.array(z.string().url()).min(1),
});

/**
 * Parse OAuth configuration from environment variables.
 * Returns null if OAuth is not configured.
 * Validates JSON config to provide clear error messages.
 */
export function getOAuthConfig(env: Env): CloudflareOAuthConfig | null {
  // Option 1: Full JSON config
  if (env.MCP_OAUTH_CONFIG) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(env.MCP_OAUTH_CONFIG);
    } catch (e) {
      console.error(
        "[Cloudflare-MCP] Failed to parse MCP_OAUTH_CONFIG as JSON:",
        e instanceof Error ? e.message : String(e)
      );
      return null;
    }

    try {
      return OAuthConfigSchema.parse(parsed) as CloudflareOAuthConfig;
    } catch (e) {
      console.error(
        "[Cloudflare-MCP] Invalid MCP_OAUTH_CONFIG:",
        e instanceof Error ? e.message : String(e)
      );
      return null;
    }
  }

  // Option 2: Individual env vars
  if (env.MCP_OAUTH_ISSUER && env.MCP_OAUTH_AUDIENCE) {
    const authServers = env.MCP_OAUTH_AUTHORIZATION_SERVERS
      ? env.MCP_OAUTH_AUTHORIZATION_SERVERS.split(",").map((s) => s.trim())
      : [env.MCP_OAUTH_ISSUER.replace(/\/$/, "")]; // Default to issuer

    return {
      issuer: env.MCP_OAUTH_ISSUER,
      audience: env.MCP_OAUTH_AUDIENCE,
      authorizationServers: authServers,
      requiredScopes: env.MCP_OAUTH_REQUIRED_SCOPES
        ? env.MCP_OAUTH_REQUIRED_SCOPES.split(",").map((s) => s.trim())
        : undefined,
      jwksUri: env.MCP_OAUTH_JWKS_URI,
    };
  }

  return null;
}
