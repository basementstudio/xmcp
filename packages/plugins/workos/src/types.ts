import { WorkOS } from "@workos-inc/node";

export interface config {
  readonly apiKey: string;
  readonly clientId: string;
  readonly baseURL: string;
  readonly authkitDomain: string;
  readonly docsURL?: string;
}

export interface JWTClaims {
  readonly sub: string;
  readonly sid: string;
  readonly iss: string;
  readonly org_id?: string;
  readonly role?: string;
  readonly permissions?: readonly string[];
  readonly exp: number;
  readonly iat: number;
  readonly aud?: string | readonly string[];
}

export interface Session {
  readonly userId: string;
  readonly sessionId: string;
  readonly organizationId?: string;
  readonly role?: string;
  readonly permissions?: readonly string[];
  readonly expiresAt: Date;
  readonly issuedAt: Date;
  readonly claims: JWTClaims;
}

export interface OAuthProtectedResourceMetadata {
  readonly resource: string;
  readonly authorization_servers: readonly string[];
  readonly bearer_methods_supported?: readonly string[];
  readonly resource_documentation?: string;
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
  client: WorkOS;
}

export interface SessionContext {
  session: Session | null;
}