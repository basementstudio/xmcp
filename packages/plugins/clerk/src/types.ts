import { ClerkClient } from "@clerk/express";

export interface ClerkConfig {
  readonly secretKey: string;
  readonly clerkDomain: string;
  readonly baseURL: string;
  readonly scopes?: string[];
  readonly docsURL?: string;
}

export interface ClerkJWTClaims {
  readonly sub: string;
  readonly sid?: string;
  readonly org_id?: string;
  readonly org_role?: string;
  readonly org_permissions?: string[];
  readonly azp?: string;
  readonly iss: string;
  readonly aud?: string | string[];
  readonly exp: number;
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

export interface ClerkClientContext {
  readonly client: ClerkClient;
}

export interface ClerkSessionContext {
  readonly session: ClerkSession | null;
}

export type TokenVerifyResult =
  | { readonly ok: true; readonly claims: ClerkJWTClaims }
  | { readonly ok: false; readonly error: "expired" | "invalid" };

export interface ClerkVerifyResponse {
  readonly object: string;
  readonly token: string;
  readonly status: string;
  readonly scopes: string[];
  readonly user_id: string;
  readonly client_id?: string;
  readonly created_at?: number;
  readonly expires_at?: number;
}
