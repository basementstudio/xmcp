import type { Router } from "express";

export interface AccessToken {
  token: string;
  clientId: string;
  scopes: string[];
  expiresAt?: Date;
  resource?: URL;
  extra?: Record<string, unknown>;
  refreshToken?: string;
}

export interface OAuthEndpoints {
  authorizationUrl: string;
  tokenUrl: string;
  registerUrl: string;
  revocationUrl?: string;
  introspectionUrl?: string;
}

export type OAuthEndpointOverrides = Partial<OAuthEndpoints>;
export type OAuthAudience = string | string[];

export interface OAuthError {
  error: string;
  error_description?: string;
  error_uri?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

export interface ProxyOAuthProviderConfig {
  endpoints: OAuthEndpoints;
  issuerUrl: string;
  baseUrl: string;
  resourceUrl: string;
  audience: OAuthAudience;
  jwksUrl?: string;
  defaultScopes: string[];
  introspectionClientId?: string;
  introspectionClientSecret?: string;
  providerMetadata: OAuthProviderMetadata;
}

export interface OAuthRouterConfig {
  provider: ProxyOAuthServerProvider;
  resolvedConfig: ResolvedOAuthConfig;
  mcpEndpoint?: string;
}

export interface ProxyOAuthServerProvider {
  verifyAccessToken(token: string): Promise<AccessToken>;
  authorize(params: AuthorizeParams): Promise<string>;
  token(params: TokenParams): Promise<TokenResponse>;
  revoke(params: RevokeParams): Promise<void>;
  readonly endpoints: OAuthEndpoints;
}

export interface AuthorizeParams {
  response_type: string;
  client_id: string;
  redirect_uri: string;
  scope?: string;
  state?: string;
  code_challenge: string;
  code_challenge_method: string;
  resource?: string;
  audience?: string;
  additionalProviderParams?: Record<string, string>;
}

export interface TokenParams {
  grant_type: string;
  client_id: string;
  client_secret?: string;
  code?: string;
  redirect_uri?: string;
  refresh_token?: string;
  code_verifier?: string;
  resource?: string;
  audience?: string;
}

export interface RevokeParams {
  token: string;
  token_type_hint?: string;
  client_id?: string;
  client_secret?: string;
}

export interface NativeOAuthMiddlewareConfig {
  endpoints?: OAuthEndpointOverrides;
  issuerUrl: string;
  baseUrl: string;
  serviceDocumentationUrl?: string;
  pathPrefix?: string;
  defaultScopes?: string[];
  middleware?: boolean;
  jwksUrl?: string;
  introspectionClientId?: string;
  introspectionClientSecret?: string;
  discovery?: boolean;
  audience?: OAuthAudience;
}

export type OAuthConfigOptions = NativeOAuthMiddlewareConfig;

export interface OAuthProxyConfig extends NativeOAuthMiddlewareConfig {
  mcpEndpoint?: string;
}

export interface OAuthProviderMetadata {
  issuer: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  registrationEndpoint: string;
  revocationEndpoint?: string;
  introspectionEndpoint?: string;
  jwksUri?: string;
  tokenEndpointAuthMethodsSupported: string[];
  scopesSupported?: string[];
  codeChallengeMethodsSupported: string[];
  grantTypesSupported: string[];
  responseTypesSupported: string[];
}

export interface ResolvedOAuthConfig {
  issuerUrl: string;
  baseUrl: string;
  resourceUrl: string;
  endpoints: OAuthEndpoints;
  serviceDocumentationUrl?: string;
  pathPrefix: string;
  defaultScopes: string[];
  middleware: boolean;
  jwksUrl?: string;
  introspectionClientId?: string;
  introspectionClientSecret?: string;
  audience: OAuthAudience;
  providerMetadata: OAuthProviderMetadata;
}

export interface OAuthProxy {
  provider: ProxyOAuthServerProvider;
  router: Router;
  middleware?: import("express").RequestHandler;
}
