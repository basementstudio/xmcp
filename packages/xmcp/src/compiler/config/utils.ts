import {
  HttpTransportConfig,
  CorsConfig,
  PathsConfig,
  OAuthConfig,
  StdioTransportConfig,
  ServerConfig,
} from "./schemas";
import {
  DEFAULT_HTTP_CONFIG,
  DEFAULT_PATHS_CONFIG,
  DEFAULT_SERVER_CONFIG,
  DEFAULT_STDIO_CONFIG,
} from "./constants";

export function getResolvedHttpConfig(
  userConfig: HttpTransportConfig | undefined
) {
  if (typeof userConfig === "boolean") {
    return userConfig ? DEFAULT_HTTP_CONFIG : null;
  }
  if (typeof userConfig === "object") {
    return { ...DEFAULT_HTTP_CONFIG, ...userConfig };
  }
  return null;
}

export function getResolvedCorsConfig(
  httpConfig: HttpTransportConfig | null
): CorsConfig {
  if (typeof httpConfig === "object" && httpConfig?.cors) {
    return { ...DEFAULT_HTTP_CONFIG.cors, ...httpConfig.cors };
  }
  return DEFAULT_HTTP_CONFIG.cors;
}

export function getResolvedPathsConfig(userConfig: any): PathsConfig {
  const userPaths = userConfig?.paths;
  if (!userPaths) {
    return DEFAULT_PATHS_CONFIG;
  }
  return { ...DEFAULT_PATHS_CONFIG, ...userPaths };
}

export function getResolvedOAuthConfig(userConfig: any): OAuthConfig | null {
  return userConfig?.experimental?.oauth || null;
}

export function getResolvedStdioConfig(
  userConfig: any
): StdioTransportConfig | null {
  return userConfig?.stdio || DEFAULT_STDIO_CONFIG;
}

export function getResolvedServerConfig(userConfig: any): ServerConfig | null {
  const userServer = userConfig?.server;
  if (!userServer) {
    return DEFAULT_SERVER_CONFIG;
  }
  return { ...DEFAULT_SERVER_CONFIG, ...userServer };
}
