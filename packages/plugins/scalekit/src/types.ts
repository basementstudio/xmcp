import { Scalekit } from "@scalekit-sdk/node";

export interface Config {
  readonly environmentUrl: string;
  readonly clientId: string;
  readonly clientSecret: string;
  readonly baseURL: string;
  readonly resourceId?: string;
  readonly docsURL?: string;
  readonly scopes?: readonly string[];
}

export interface JWTClaims {
  readonly sub: string;
  readonly iss: string;
  readonly aud?: string | readonly string[];
  readonly exp: number;
  readonly iat: number;
  readonly scope?: string;
  readonly sid?: string;
  readonly org_id?: string;
}

export interface Session {
  readonly userId: string;
  readonly scopes: readonly string[];
  readonly organizationId?: string;
  readonly expiresAt: Date;
  readonly issuedAt: Date;
  readonly claims: JWTClaims;
}

export interface OAuthProtectedResourceMetadata {
  readonly resource: string;
  readonly authorization_servers: readonly string[];
  readonly bearer_methods_supported?: readonly string[];
  readonly resource_documentation?: string;
  readonly scopes_supported?: readonly string[];
}

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

export interface ClientContext {
  client: Scalekit;
}

export interface SessionContext {
  session: Session | null;
}