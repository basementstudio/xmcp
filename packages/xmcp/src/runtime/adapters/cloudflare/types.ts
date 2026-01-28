/**
 * Shared types for Cloudflare Workers adapter.
 * Placed here to avoid circular dependencies.
 */

/**
 * Cloudflare Workers environment bindings.
 * Users can extend this with their own bindings.
 */
export interface Env {
  /**
   * Optional API key for authenticating MCP requests.
   * Set via: wrangler secret put MCP_API_KEY
   * Clients must send: Authorization: Bearer <key>
   */
  MCP_API_KEY?: string;

  // ===== OAuth Configuration =====
  // Option 1: JSON config (most flexible)
  /**
   * Full OAuth configuration as JSON string.
   * Example: {"issuer":"https://your-domain.auth0.com/","audience":"https://your-api","authorizationServers":["https://your-domain.auth0.com"]}
   */
  MCP_OAUTH_CONFIG?: string;

  // Option 2: Individual env vars (simpler setup)
  /**
   * OAuth issuer URL (e.g., "https://your-domain.auth0.com/")
   */
  MCP_OAUTH_ISSUER?: string;

  /**
   * Expected audience for JWT validation
   */
  MCP_OAUTH_AUDIENCE?: string;

  /**
   * Comma-separated list of authorization servers
   */
  MCP_OAUTH_AUTHORIZATION_SERVERS?: string;

  /**
   * Comma-separated list of required scopes (optional)
   */
  MCP_OAUTH_REQUIRED_SCOPES?: string;

  /**
   * Custom JWKS URI (optional, derived from issuer by default)
   */
  MCP_OAUTH_JWKS_URI?: string;

  /**
   * Additional user-defined bindings (KV, D1, etc.)
   */
  [key: string]: unknown;
}

/**
 * Cloudflare Workers ExecutionContext type
 */
export interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}
