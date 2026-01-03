import { IncomingHttpHeaders } from "http";

export interface WorkOSConfig {
  /** WorkOS API key (sk_test_... or sk_live_...) */
  apiKey: string;
  /** WorkOS Client ID (client_...) */
  clientId: string;
  baseURL: string;
  authkitDomain: string;
}

export interface WorkOSJWTClaims {
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

export interface WorkOSSession {
  userId: string;
  sessionId: string;
  organizationId?: string;
  role?: string;
  permissions?: string[];
  expiresAt: Date;
  issuedAt: Date;
  claims: WorkOSJWTClaims;
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
}

export interface WorkOSContext {
  session: WorkOSSession | null;
  headers: IncomingHttpHeaders;
}