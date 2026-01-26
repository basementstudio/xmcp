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
  authorizationServers: string[];
  scopesSupported?: string[];
  bearerMethodsSupported?: string[];
}

@Injectable()
export class OAuthService {
  constructor(@Inject(OAUTH_CONFIG) private readonly config: OAuthConfig) {}

  getResourceMetadata(req: Request): OAuthProtectedResourceMetadata {
    const resource = buildBaseUrl(req);

    return {
      resource,
      authorizationServers: this.config.authorizationServers,
      ...(this.config.scopesSupported && {
        scopesSupported: this.config.scopesSupported,
      }),
      bearerMethodsSupported: this.config.bearerMethodsSupported || ["header"],
    };
  }
}
