/**
 * OAuth configuration for Cloudflare Workers adapter.
 * Supports Auth0, WorkOS, Clerk, and custom OAuth providers.
 */
export interface CloudflareOAuthConfig {
  /**
   * OAuth provider type (for preset configurations).
   * Use "custom" for non-standard providers.
   */
  provider?: "auth0" | "workos" | "clerk" | "custom";

  /**
   * JWT issuer URL (required).
   * Examples:
   * - Auth0: https://your-domain.auth0.com/
   * - WorkOS: https://api.workos.com/
   * - Clerk: https://your-domain.clerk.accounts.dev/
   */
  issuer: string;

  /**
   * Expected audience (your API identifier).
   * This should match the "aud" claim in the JWT.
   */
  audience: string;

  /**
   * Custom JWKS URI (optional).
   * If not provided, it will be derived from the issuer:
   * - Default: {issuer}.well-known/jwks.json
   */
  jwksUri?: string;

  /**
   * Required scopes for MCP access (optional).
   * If specified, tokens must contain ALL of these scopes.
   * Example: ["mcp:access", "tools:read"]
   */
  requiredScopes?: string[];

  /**
   * Whether authentication is required (default: true if config provided).
   * Set to false to allow unauthenticated access when no token is provided.
   */
  required?: boolean;

  /**
   * Authorization servers to advertise in the OAuth Protected Resource Metadata.
   * These are the OAuth servers that can issue tokens for this resource.
   * Example: ["https://your-domain.auth0.com"]
   */
  authorizationServers: string[];
}

/**
 * Extended AuthInfo for OAuth-authenticated requests.
 * Includes JWT payload information beyond the basic AuthInfo.
 */
export interface OAuthAuthInfo {
  /**
   * The raw JWT token
   */
  token: string;

  /**
   * Client identifier (from azp, client_id, or sub claim)
   */
  clientId: string;

  /**
   * Scopes granted to this token
   */
  scopes: string[];

  /**
   * Token expiration timestamp (Unix epoch seconds)
   */
  expiresAt?: number;

  /**
   * Additional claims from the JWT payload
   */
  extra: {
    /** Subject (user ID) */
    sub?: string;
    /** User email if available */
    email?: string;
    /** User name if available */
    name?: string;
    /** Any other JWT claims */
    [key: string]: unknown;
  };
}

/**
 * OAuth Protected Resource Metadata (RFC 9728).
 * Returned by /.well-known/oauth-protected-resource endpoint.
 */
export interface OAuthProtectedResourceMetadata {
  /**
   * The resource identifier (base URL of the worker)
   */
  resource: string;

  /**
   * Authorization servers that can issue tokens for this resource
   */
  authorization_servers: string[];

  /**
   * Supported methods for sending bearer tokens
   */
  bearer_methods_supported: string[];

  /**
   * Scopes supported by this resource (optional per RFC 9728)
   */
  scopes_supported?: string[];
}
