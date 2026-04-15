import { createRemoteJWKSet, jwtVerify, errors } from "jose";
import {
  ProxyOAuthServerProvider as IProxyOAuthServerProvider,
  ProxyOAuthProviderConfig,
  AccessToken,
  AuthorizeParams,
  TokenParams,
  RevokeParams,
  TokenResponse,
  OAuthError,
} from "../types";

type IntrospectionResponse = {
  active?: boolean;
  client_id?: string;
  scope?: string;
  exp?: number;
  iss?: string;
  aud?: string | string[];
  resource?: string;
  [key: string]: unknown;
};

export class ProxyOAuthServerProvider implements IProxyOAuthServerProvider {
  private config: ProxyOAuthProviderConfig;

  constructor(config: ProxyOAuthProviderConfig) {
    this.config = config;
  }

  get endpoints() {
    return this.config.endpoints;
  }

  async verifyAccessToken(token: string): Promise<AccessToken> {
    return await this.verifyTokenWithProvider(token);
  }

  async authorize(params: AuthorizeParams): Promise<string> {
    const {
      client_id,
      redirect_uri,
      response_type,
      scope,
      state,
      resource,
      audience,
      additionalProviderParams,
    } = params;

    const authUrl = new URL(this.config.endpoints.authorizationUrl);
    authUrl.searchParams.set("response_type", response_type);
    authUrl.searchParams.set("client_id", client_id);
    authUrl.searchParams.set("redirect_uri", redirect_uri);

    if (scope) {
      authUrl.searchParams.set("scope", scope);
    } else if (this.config.defaultScopes) {
      authUrl.searchParams.set("scope", this.config.defaultScopes.join(" "));
    }

    if (state) {
      authUrl.searchParams.set("state", state);
    }

    if (resource ?? this.config.resourceUrl) {
      authUrl.searchParams.set("resource", resource ?? this.config.resourceUrl);
    }

    const resolvedAudience = audience ?? firstAudience(this.config.audience);
    if (resolvedAudience) {
      authUrl.searchParams.set("audience", resolvedAudience);
    }

    if (additionalProviderParams) {
      for (const [key, value] of Object.entries(additionalProviderParams)) {
        authUrl.searchParams.set(key, value);
      }
    }

    return authUrl.toString();
  }

  async token(params: TokenParams): Promise<TokenResponse> {
    const {
      grant_type,
      client_id,
      client_secret,
      code,
      redirect_uri,
      refresh_token,
      code_verifier,
    } = params;

    try {
      const response = await fetch(this.config.endpoints.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: new URLSearchParams({
          grant_type,
          client_id,
          ...(client_secret && { client_secret }),
          ...(code && { code }),
          ...(redirect_uri && { redirect_uri }),
          ...(refresh_token && { refresh_token }),
          ...(code_verifier && { code_verifier }),
          ...(params.resource && { resource: params.resource }),
          ...(params.audience && { audience: params.audience }),
          ...(!params.resource &&
            this.config.resourceUrl && {
              resource: this.config.resourceUrl,
            }),
          ...(!params.audience &&
            firstAudience(this.config.audience) && {
              audience: firstAudience(this.config.audience)!,
            }),
        }),
      });

      const tokenData = await response.json();

      if (!response.ok) {
        throw this.createOAuthError(
          tokenData.error || "server_error",
          tokenData.error_description || "Token exchange failed"
        );
      }

      if (tokenData.access_token) {
        return tokenData as TokenResponse;
      }

      return tokenData as TokenResponse;
    } catch (error) {
      if (error instanceof Error && "oauth" in error) {
        throw error;
      }
      throw this.createOAuthError("server_error", "Failed to exchange token");
    }
  }

  async revoke(params: RevokeParams): Promise<void> {
    const { token, token_type_hint, client_id, client_secret } = params;

    if (this.config.endpoints.revocationUrl) {
      const response = await fetch(this.config.endpoints.revocationUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: new URLSearchParams({
          token,
          ...(token_type_hint && { token_type_hint }),
          ...(client_id && { client_id }),
          ...(client_secret && { client_secret }),
        }),
      });

      if (!response.ok) {
        throw this.createOAuthError("server_error", "Failed to revoke token");
      }
    }
  }

  private async verifyTokenWithProvider(token: string): Promise<AccessToken> {
    // Prefer JWKS validation when configured. It stays fully local and avoids
    // an extra network round-trip, at the cost of not seeing revocation until
    // expiry. Operators that need revocation checks should configure
    // introspection instead of, or in addition to, JWKS.
    if (this.config.jwksUrl) {
      return await this.verifyTokenWithJwks(token);
    }

    if (this.config.endpoints.introspectionUrl) {
      return await this.verifyTokenWithIntrospection(token);
    }

    throw this.createOAuthError(
      "invalid_token",
      "Token verification is not configured. Provide jwksUrl or endpoints.introspectionUrl."
    );
  }

  private async verifyTokenWithJwks(token: string): Promise<AccessToken> {
    try {
      const jwks = createRemoteJWKSet(new URL(this.config.jwksUrl!));
      const { payload } = await jwtVerify(token, jwks, {
        issuer: this.config.issuerUrl,
        audience: this.config.audience,
        clockTolerance: 30,
      });

      const clientId =
        typeof payload.client_id === "string"
          ? payload.client_id
          : typeof payload.azp === "string"
            ? payload.azp
            : undefined;

      if (!clientId) {
        throw this.createOAuthError(
          "invalid_token",
          "JWT is missing client_id or azp"
        );
      }

      const scopes =
        typeof payload.scope === "string"
          ? payload.scope.split(" ").filter(Boolean)
          : [];

      return {
        token,
        clientId,
        scopes,
        expiresAt:
          typeof payload.exp === "number"
            ? new Date(payload.exp * 1000)
            : undefined,
        resource: new URL(this.config.resourceUrl),
        extra: payload as Record<string, unknown>,
      };
    } catch (error) {
      if (error instanceof errors.JWTExpired) {
        throw this.createOAuthError("invalid_token", "Token has expired");
      }

      if (error instanceof Error && "oauth" in error) {
        throw error;
      }

      throw this.createOAuthError(
        "invalid_token",
        error instanceof Error ? error.message : "JWT verification failed"
      );
    }
  }

  private async verifyTokenWithIntrospection(
    token: string
  ): Promise<AccessToken> {
    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    };

    if (
      this.config.introspectionClientId &&
      this.config.introspectionClientSecret
    ) {
      headers.Authorization = `Basic ${Buffer.from(
        `${this.config.introspectionClientId}:${this.config.introspectionClientSecret}`
      ).toString("base64")}`;
    }

    const response = await fetch(this.config.endpoints.introspectionUrl!, {
      method: "POST",
      headers,
      body: new URLSearchParams({ token }),
    });

    if (!response.ok) {
      throw this.createOAuthError(
        "server_error",
        "Token introspection failed"
      );
    }

    const data = (await response.json()) as IntrospectionResponse;

    if (!data.active) {
      throw this.createOAuthError("invalid_token", "Token is inactive");
    }

    if (!data.client_id) {
      throw this.createOAuthError(
        "invalid_token",
        "Token introspection response is missing client_id"
      );
    }

    this.assertIntrospectionAudience(data);

    return {
      token,
      clientId: data.client_id,
      scopes: typeof data.scope === "string"
        ? data.scope.split(" ").filter(Boolean)
        : [],
      expiresAt:
        typeof data.exp === "number" ? new Date(data.exp * 1000) : undefined,
      resource: new URL(this.config.resourceUrl),
      extra: data as Record<string, unknown>,
    };
  }

  private assertIntrospectionAudience(data: IntrospectionResponse) {
    const expectedAudiences = Array.isArray(this.config.audience)
      ? this.config.audience
      : [this.config.audience];
    const actualAudiences = [
      ...(Array.isArray(data.aud)
        ? data.aud.filter((value): value is string => typeof value === "string")
        : typeof data.aud === "string"
          ? [data.aud]
          : []),
      ...(typeof data.resource === "string" ? [data.resource] : []),
    ];

    if (
      expectedAudiences.length > 0 &&
      !expectedAudiences.some((expected) => actualAudiences.includes(expected))
    ) {
      throw this.createOAuthError(
        "invalid_token",
        "Token audience/resource does not match the configured MCP resource server"
      );
    }
  }

  private createOAuthError(error: string, description?: string): Error {
    const oauthError: OAuthError = {
      error,
      error_description: description,
    };

    const errorObj = new Error(description || error);
    (errorObj as any).oauth = oauthError;
    return errorObj;
  }
}

function firstAudience(audience: string | string[]): string | undefined {
  return Array.isArray(audience) ? audience[0] : audience;
}
