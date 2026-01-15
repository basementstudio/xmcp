import type { ApiClient } from "@auth0/auth0-api-js";
import type { ManagementClient } from "auth0";

export interface Config {
  domain: string;
  audience: string;
  baseURL: string;
  clientId: string;
  clientSecret: string;
  scopesSupported?: readonly string[];
  publicTools?: readonly string[];
  management?: ManagementConfig;
}

export interface ManagementConfig {
  enable: boolean;
  audience?: string;
  resourceServerIdentifier?: string;
}

export interface AuthInfo {
  token: string;
  clientId: string;
  scopes: readonly string[];
  permissions?: readonly string[];
  expiresAt?: number;
  user: UserClaims;
}

export interface UserClaims {
  sub: string;
  client_id?: string;
  azp?: string;
  name?: string;
  email?: string;
}

export type TokenVerifyResult =
  | { ok: true; authInfo: AuthInfo }
  | {
      ok: false;
      error: "expired" | "invalid";
      message: string;
    };

export interface SessionContext {
  authInfo: AuthInfo | null;
}

export interface ClientContext {
  config: Config;
  apiClient: ApiClient | null;
  managementClient: ManagementClient | null;
}

export interface OAuthProtectedResourceMetadata {
  resource: string;
  authorization_servers: readonly string[];
  jwks_uri?: string;
  scopes_supported?: readonly string[];
  bearer_methods_supported?: readonly string[];
  resource_documentation?: string;
}

export interface OAuthAuthorizationServerMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  response_types_supported: readonly string[];
  grant_types_supported: readonly string[];
  code_challenge_methods_supported?: readonly string[];
  token_endpoint_auth_methods_supported?: readonly string[];
  scopes_supported?: readonly string[];
}
