import type { IncomingHttpHeaders } from "http";

export interface ClerkConfig {
  /** Clerk Secret Key (sk_test_... or sk_live_...) */
  readonly secretKey: string;
  /** Clerk Frontend API domain (e.g., your-app.clerk.accounts.dev) */
  readonly clerkDomain: string;
  /** Base URL of your MCP server */
  readonly baseURL: string;
  /** OAuth scopes to request (default: ['profile', 'email']) */
  readonly scopes?: string[];
  /** Optional URL to your MCP server's API documentation */
  readonly docsURL?: string;
}

export interface ClerkJWTClaims {
  /** User ID */
  readonly sub: string;
  /** Session ID */
  readonly sid?: string;
  /** Organization ID */
  readonly org_id?: string;
  /** Role in organization */
  readonly org_role?: string;
  /** Permissions in organization */
  readonly org_permissions?: string[];
  /** Authorized party (client ID) */
  readonly azp?: string;
  /** Issuer */
  readonly iss: string;
  /** Audience */
  readonly aud?: string | string[];
  /** Expiration time */
  readonly exp: number;
  /** Issued at */
  readonly iat: number;
}

export interface ClerkSession {
  readonly userId: string;
  readonly sessionId: string | undefined;
  readonly organizationId: string | undefined;
  readonly organizationRole: string | undefined;
  readonly organizationPermissions: string[] | undefined;
  readonly expiresAt: Date;
  readonly issuedAt: Date;
  readonly claims: ClerkJWTClaims;
}

export interface OAuthProtectedResourceMetadata {
  readonly resource: string;
  readonly authorization_servers: string[];
  readonly bearer_methods_supported?: string[];
  readonly resource_documentation?: string;
  readonly scopes_supported?: string[];
}

export interface OAuthAuthorizationServerMetadata {
  readonly issuer: string;
  readonly authorization_endpoint: string;
  readonly token_endpoint: string;
  readonly jwks_uri: string;
  readonly response_types_supported: string[];
  readonly grant_types_supported: string[];
  readonly code_challenge_methods_supported?: string[];
  readonly token_endpoint_auth_methods_supported?: string[];
  readonly scopes_supported?: string[];
  readonly registration_endpoint?: string;
}

export interface ClerkContext {
  readonly session: ClerkSession | null;
  readonly headers: IncomingHttpHeaders;
}

