/**
 * OAuth configuration parsing and validation for Cloudflare Workers adapter.
 */

import type { CloudflareOAuthConfig } from "./types";
import type { Env } from "../types";

/**
 * Zod-like schema for OAuth configuration validation.
 * Used to provide clear error messages when config is malformed.
 */
export const OAuthConfigSchema = {
  validate(data: unknown): { success: true; data: CloudflareOAuthConfig } | { success: false; error: string } {
    // Manual validation since Zod is optional
    if (typeof data !== "object" || data === null) {
      return { success: false, error: "Config must be an object" };
    }

    const config = data as Record<string, unknown>;

    // Required: issuer (string URL)
    if (typeof config.issuer !== "string" || !config.issuer) {
      return { success: false, error: "Missing or invalid 'issuer' (must be a URL string)" };
    }
    try {
      new URL(config.issuer);
    } catch {
      return { success: false, error: `Invalid 'issuer' URL: ${config.issuer}` };
    }

    // Required: audience (string)
    if (typeof config.audience !== "string" || !config.audience) {
      return { success: false, error: "Missing or invalid 'audience' (must be a non-empty string)" };
    }

    // Required: authorizationServers (array of URL strings)
    if (!Array.isArray(config.authorizationServers) || config.authorizationServers.length === 0) {
      return { success: false, error: "Missing or invalid 'authorizationServers' (must be a non-empty array of URLs)" };
    }
    for (const server of config.authorizationServers) {
      if (typeof server !== "string") {
        return { success: false, error: `Invalid authorization server: ${server} (must be a URL string)` };
      }
      try {
        new URL(server);
      } catch {
        return { success: false, error: `Invalid authorization server URL: ${server}` };
      }
    }

    // Optional: provider (enum)
    if (config.provider !== undefined) {
      const validProviders = ["auth0", "workos", "clerk", "custom"];
      if (!validProviders.includes(config.provider as string)) {
        return { success: false, error: `Invalid 'provider': ${config.provider} (must be one of: ${validProviders.join(", ")})` };
      }
    }

    // Optional: requiredScopes (array of strings)
    if (config.requiredScopes !== undefined) {
      if (!Array.isArray(config.requiredScopes)) {
        return { success: false, error: "'requiredScopes' must be an array of strings" };
      }
      for (const scope of config.requiredScopes) {
        if (typeof scope !== "string") {
          return { success: false, error: `Invalid scope: ${scope} (must be a string)` };
        }
      }
    }

    // Optional: jwksUri (URL string)
    if (config.jwksUri !== undefined) {
      if (typeof config.jwksUri !== "string") {
        return { success: false, error: "'jwksUri' must be a URL string" };
      }
      try {
        new URL(config.jwksUri);
      } catch {
        return { success: false, error: `Invalid 'jwksUri' URL: ${config.jwksUri}` };
      }
    }

    // Optional: required (boolean)
    if (config.required !== undefined && typeof config.required !== "boolean") {
      return { success: false, error: "'required' must be a boolean" };
    }

    return {
      success: true,
      data: {
        provider: config.provider as CloudflareOAuthConfig["provider"],
        issuer: config.issuer,
        audience: config.audience,
        authorizationServers: config.authorizationServers as string[],
        requiredScopes: config.requiredScopes as string[] | undefined,
        jwksUri: config.jwksUri as string | undefined,
        required: config.required as boolean | undefined,
      },
    };
  },
};

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

    // Validate the parsed config
    const result = OAuthConfigSchema.validate(parsed);
    if (!result.success) {
      console.error(
        "[Cloudflare-MCP] Invalid MCP_OAUTH_CONFIG:",
        result.error
      );
      return null;
    }

    return result.data;
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
