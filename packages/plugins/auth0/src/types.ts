/**
 * Configuration for Auth0 provider
 */
export interface Auth0Config {
  /** Auth0 domain (e.g., "your-tenant.auth0.com") */
  readonly domain: string;
  /** Auth0 API audience identifier */
  readonly audience: string;
  /** Base URL of the MCP server */
  readonly baseURL: string;
  /** Optional list of supported scopes for OAuth metadata */
  readonly scopesSupported?: readonly string[];
}

/**
 * Authentication information extracted from Auth0 JWT token.
 */
export interface AuthInfo {
  /** The raw access token */
  readonly token: string;
  /** The client ID that requested the token */
  readonly clientId: string;
  /** Scopes granted to this token */
  readonly scopes: readonly string[];
  /** Token expiration timestamp (Unix epoch) */
  readonly expiresAt?: number;
  /** Additional user identity claims */
  readonly extra: AuthInfoExtra;
}

/**
 * Additional identity claims from the Auth0 token
 */
export interface AuthInfoExtra {
  /** User identifier from Auth0 (subject claim) */
  readonly sub: string;
  /** Standard OAuth 2.0 client_id claim, if available */
  readonly client_id?: string;
  /** Auth0-specific azp (authorized party) claim, if available */
  readonly azp?: string;
  /** User's full name, if available */
  readonly name?: string;
  /** User's email address, if available */
  readonly email?: string;
}

/**
 * Context stored during request processing
 */
export interface AuthContext {
  authInfo: AuthInfo | null;
}

/**
 * Config context
 */
export interface ConfigContext {
  config: Auth0Config;
}

/**
 * OAuth 2.0 Protected Resource Metadata (RFC 9728)
 */
export interface OAuthProtectedResourceMetadata {
  readonly resource: string;
  readonly authorization_servers: readonly string[];
  readonly jwks_uri?: string;
  readonly scopes_supported?: readonly string[];
  readonly bearer_methods_supported?: readonly string[];
  readonly resource_documentation?: string;
}

/**
 * OAuth 2.0 Authorization Server Metadata (RFC 8414)
 */
export interface OAuthAuthorizationServerMetadata {
  readonly issuer: string;
  readonly authorization_endpoint: string;
  readonly token_endpoint: string;
  readonly jwks_uri: string;
  readonly response_types_supported: readonly string[];
  readonly grant_types_supported: readonly string[];
  readonly code_challenge_methods_supported?: readonly string[];
  readonly token_endpoint_auth_methods_supported?: readonly string[];
  readonly scopes_supported?: readonly string[];
}

/**
 * Result type for token verification
 */
export type TokenVerifyResult =
  | { readonly ok: true; readonly authInfo: AuthInfo }
  | { readonly ok: false; readonly error: "expired" | "invalid"; readonly message: string };
