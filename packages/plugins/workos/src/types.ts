/**
 * WorkOS AuthKit configuration
 */
export interface WorkOSConfig {
  /** WorkOS API key (sk_test_... or sk_live_...) */
  apiKey: string;
  /** WorkOS Client ID (client_...) */
  clientId: string;
  /** Base URL of your MCP server (e.g., http://127.0.0.1:3002) */
  baseURL: string;
  /** AuthKit domain (e.g., balanced-farm-35-staging.authkit.app) */
  authkitDomain: string;
}

/**
 * WorkOS JWT claims structure
 * Based on WorkOS AuthKit JWT token structure
 */
export interface WorkOSJWTClaims {
  /** WorkOS user ID */
  sub: string;
  /** Session ID */
  sid: string;
  /** Issuer URL (AuthKit domain) */
  iss: string;
  /** Organization ID (optional) */
  org_id?: string;
  /** User role (optional) */
  role?: string;
  /** Array of permissions (optional) */
  permissions?: string[];
  /** Expiration timestamp */
  exp: number;
  /** Issued at timestamp */
  iat: number;
  /** Audience (optional) */
  aud?: string | string[];
}

/**
 * WorkOS session data available in context
 */
export interface WorkOSSession {
  /** WorkOS user ID */
  userId: string;
  /** Session ID */
  sessionId: string;
  /** Organization ID (optional) */
  organizationId?: string;
  /** User role (optional) */
  role?: string;
  /** User permissions (optional) */
  permissions?: string[];
  /** Token expiration date */
  expiresAt: Date;
  /** Token issued date */
  issuedAt: Date;
  /** Raw JWT claims */
  claims: WorkOSJWTClaims;
}

/**
 * OAuth Protected Resource Metadata
 * Per RFC 8707 / MCP OAuth spec
 */
export interface OAuthProtectedResourceMetadata {
  resource: string;
  authorization_servers: string[];
  bearer_methods_supported?: string[];
  resource_documentation?: string;
}

/**
 * OAuth Authorization Server Metadata
 */
export interface OAuthAuthorizationServerMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  response_types_supported: string[];
  grant_types_supported: string[];
  code_challenge_methods_supported?: string[];
  token_endpoint_auth_methods_supported?: string[];
}
