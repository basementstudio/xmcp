import { WorkOS } from "@workos-inc/node";

export interface config {
  readonly apiKey: string;
  readonly clientId: string;
  readonly baseURL: string;
  readonly authkitDomain: string;
  readonly docsURL?: string;
}

export interface JWTClaims {
  sub: string;
  sid: string;
  iss: string;
  org_id?: string;
  role?: string;
  permissions?: string[];
  exp: number;
  iat: number;
  aud?: string | string[];
}

export interface Session {
  userId: string;
  sessionId: string;
  organizationId?: string;
  role?: string;
  permissions?: string[];
  expiresAt: Date;
  issuedAt: Date;
  claims: JWTClaims;
}

export interface OAuthProtectedResourceMetadata {
  resource: string;
  authorization_servers: string[];
  bearer_methods_supported?: string[];
  resource_documentation?: string;
}

export interface OAuthAuthorizationServerMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  response_types_supported: string[];
  grant_types_supported: string[];
  code_challenge_methods_supported?: string[];
  token_endpoint_auth_methods_supported?: string[];
  scopes_supported?: string[];
}

export interface ClientContext {
  client: WorkOS;
}

export interface SessionContext {
  session: Session | null;
}