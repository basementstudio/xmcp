import type { ApiClient } from "@auth0/auth0-api-js";
import type { ManagementClient } from "auth0";

// ============================================
// Configuration Types
// ============================================

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
  /** Optional Auth0 Management API configuration for permission validation */
  readonly management?: Auth0ManagementConfig;
}

/**
 * Optional Auth0 Management API configuration
 */
export interface Auth0ManagementConfig {
  /** Client ID with Management API access (client credentials) */
  readonly clientId: string;
  /** Client secret for the Management API client */
  readonly clientSecret: string;
  /** Audience for Management API token (default: https://<domain>/api/v2/) */
  readonly audience?: string;
  /** Resource server identifier to validate (defaults to Auth0Config.audience) */
  readonly resourceServerIdentifier?: string;
}

// ============================================
// Authentication & Authorization Types
// ============================================

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
  /** Permissions granted to this token (Auth0 RBAC) */
  readonly permissions?: readonly string[];
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
 * Result type for token verification
 */
export type TokenVerifyResult =
  | { readonly ok: true; readonly authInfo: AuthInfo }
  | { readonly ok: false; readonly error: "expired" | "invalid"; readonly message: string };

// ============================================
// Context Types
// ============================================

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
 * Context for storing the Auth0 API client (token verification)
 */
export interface ApiClientContext {
  apiClient: ApiClient | null;
}

/**
 * Context for storing the Auth0 Management API client (official SDK)
 */
export interface ManagementClientContext {
  managementClient: ManagementClient | null;
}

// ============================================
// OAuth Metadata Types (RFC 8414, RFC 9728)
// ============================================

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

// ============================================
// User Types
// ============================================

/**
 * Auth0 User profile from Management API
 * Note: The official SDK also exports GetUsers200ResponseOneOfInner but this
 * interface provides a cleaner type for common use cases.
 */
export interface Auth0User {
  /** Auth0 user ID (e.g., "auth0|123456") */
  readonly user_id: string;
  /** User's email address */
  readonly email?: string;
  /** Whether email is verified */
  readonly email_verified?: boolean;
  /** User's full name */
  readonly name?: string;
  /** User's nickname */
  readonly nickname?: string;
  /** URL to user's profile picture */
  readonly picture?: string;
  /** When the user was created */
  readonly created_at?: string;
  /** When the user was last updated */
  readonly updated_at?: string;
  /** User metadata (custom data set by user) */
  readonly user_metadata?: Record<string, unknown>;
  /** App metadata (custom data set by app) */
  readonly app_metadata?: Record<string, unknown>;
}

