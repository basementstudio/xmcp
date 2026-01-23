import { Injectable, Inject } from "@nestjs/common";
import { Request } from "express";
import { buildBaseUrl } from "./xmcp.utils";

export const OAUTH_CONFIG = Symbol("OAUTH_CONFIG");

export interface OAuthConfig {
  authorizationServers: string[];
  scopesSupported?: string[];
  bearerMethodsSupported?: string[];
}

export interface OAuthProtectedResourceMetadata {
  resource: string;
  authorization_servers: string[];
  scopes_supported?: string[];
  bearer_methods_supported?: string[];
}

@Injectable()
export class OAuthService {
  constructor(@Inject(OAUTH_CONFIG) private readonly config: OAuthConfig) {}

  getResourceMetadata(req: Request): OAuthProtectedResourceMetadata {
    const resource = buildBaseUrl(req);

    return {
      resource,
      authorization_servers: this.config.authorizationServers,
      ...(this.config.scopesSupported && {
        scopes_supported: this.config.scopesSupported,
      }),
      bearer_methods_supported:
        this.config.bearerMethodsSupported || ["header"],
    };
  }
}
