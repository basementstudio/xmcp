export interface DescopeConfig {
  projectId: string;
  mcpServerId: string;
  baseURL: string;
  managementKey?: string;
  scopesSupported?: string[];
}

export interface DescopeTenant {
  permissions?: string[];
  roles?: string[];
}

export interface DescopeSession {
  userId: string;
  email: string;
  token: string;
  loginIds: string[];
  tenants: Record<string, DescopeTenant>;
  permissions: string[];
  roles: string[];
  expiresAt: Date;
  issuedAt: Date;
  claims: Record<string, unknown>;
}

export interface OAuthProtectedResourceMetadata {
  resource: string;
  authorization_servers: string[];
  scopes_supported: string[];
  bearer_methods_supported: string[];
}

export interface OAuthAuthorizationServerMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri?: string;
  response_types_supported?: string[];
  grant_types_supported?: string[];
  code_challenge_methods_supported?: string[];
  [key: string]: unknown;
}

export type TokenVerifyResult =
  | { ok: true; session: DescopeSession }
  | { ok: false; error: "expired" | "invalid"; message: string };
