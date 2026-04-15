import { ProxyOAuthServerProvider } from "./providers/proxy-provider";
import { createOAuthRouter, createOAuthMiddleware } from "./router";
import {
  ProxyOAuthProviderConfig,
  OAuthRouterConfig,
  OAuthProxyConfig,
  OAuthProxy,
  NativeOAuthMiddlewareConfig,
} from "./types";
import { resolveOAuthConfig } from "./resolve-config";
import { MiddlewareProviderFactory } from "@/types/middleware";

export async function createOAuthProxy(
  config: OAuthProxyConfig
): Promise<OAuthProxy> {
  const resolvedConfig = await resolveOAuthConfig(config);
  const providerConfig: ProxyOAuthProviderConfig = {
    endpoints: resolvedConfig.endpoints,
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

export function nativeOAuthMiddleware(
  config: NativeOAuthMiddlewareConfig
): MiddlewareProviderFactory {
  return {
    async resolve(context) {
      const proxy = await createOAuthProxy({
        ...config,
        mcpEndpoint: context.endpoint,
      });

      return {
        router: proxy.router,
        middleware: proxy.middleware,
      };
    },
  };
}
