import type { ApiClient } from "@auth0/auth0-api-js";
import type { ManagementClient } from "auth0";

export interface Auth0Config {
  readonly domain: string;
  readonly audience: string;
  readonly baseURL: string;
  readonly scopesSupported?: readonly string[];
  readonly management?: Auth0ManagementConfig;
}

export interface Auth0ManagementConfig {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly audience?: string;
  readonly resourceServerIdentifier?: string;
}

export interface AuthInfo {
  readonly token: string;
  readonly clientId: string;
  readonly scopes: readonly string[];
  readonly permissions?: readonly string[];
  readonly expiresAt?: number;
  readonly user: UserClaims;
}

export interface UserClaims {
  readonly sub: string;
  readonly client_id?: string;
  readonly azp?: string;
  readonly name?: string;
  readonly email?: string;
}

export type TokenVerifyResult =
  | { readonly ok: true; readonly authInfo: AuthInfo }
  | {
      readonly ok: false;
      readonly error: "expired" | "invalid";
      readonly message: string;
    };

export interface AuthContext {
  authInfo: AuthInfo | null;
}

export interface Auth0Context {
  config: Auth0Config;
  apiClient: ApiClient | null;
  managementClient: ManagementClient | null;
}

export interface OAuthProtectedResourceMetadata {
  readonly resource: string;
  readonly authorization_servers: readonly string[];
  readonly jwks_uri?: string;
  readonly scopes_supported?: readonly string[];
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

export interface Auth0User {
  readonly user_id: string;
  readonly email?: string;
  readonly email_verified?: boolean;
  readonly name?: string;
  readonly nickname?: string;
  readonly picture?: string;
  readonly created_at?: string;
  readonly updated_at?: string;
  readonly user_metadata?: Record<string, unknown>;
  readonly app_metadata?: Record<string, unknown>;
}
