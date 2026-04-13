import { RequestHandler } from "express";
import { ProxyOAuthServerProvider } from "./providers/proxy-provider";
import { createOAuthRouter, createOAuthMiddleware } from "./router";
import { MemoryOAuthStorage } from "./storage/memory-storage";
import { ProxyOAuthProviderConfig, OAuthRouterConfig, OAuthProxyConfig } from "./types";
import { resolveOAuthConfig } from "./resolve-config";

export interface OAuthProxy {
  provider: ProxyOAuthServerProvider;
  router: RequestHandler;
  middleware?: RequestHandler;
}

export async function createOAuthProxy(
  config: OAuthProxyConfig
): Promise<OAuthProxy> {
  const resolvedConfig = await resolveOAuthConfig(config);
  const providerConfig: ProxyOAuthProviderConfig = {
    endpoints: resolvedConfig.endpoints,
    storage: config.storage || new MemoryOAuthStorage(),
    issuerUrl: resolvedConfig.issuerUrl,
    baseUrl: resolvedConfig.baseUrl,
    resourceUrl: resolvedConfig.resourceUrl,
    audience: resolvedConfig.audience,
    jwksUrl: resolvedConfig.jwksUrl,
    defaultScopes: resolvedConfig.defaultScopes,
    introspectionClientId: resolvedConfig.introspectionClientId,
    introspectionClientSecret: resolvedConfig.introspectionClientSecret,
    providerMetadata: resolvedConfig.providerMetadata,
  };

  const provider = new ProxyOAuthServerProvider(providerConfig);

  const routerConfig: OAuthRouterConfig = {
    provider,
    resolvedConfig,
    mcpEndpoint: config.mcpEndpoint,
  };

  return {
    provider,
    router: createOAuthRouter(routerConfig),
    middleware:
      resolvedConfig.middleware !== false
        ? createOAuthMiddleware(provider, {
            protectedPath: config.mcpEndpoint,
          })
        : undefined,
  };
}
