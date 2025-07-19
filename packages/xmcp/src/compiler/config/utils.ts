import {
  HttpTransportConfig,
  CorsConfig,
  PathsConfig,
  OAuthConfig,
} from "./schemas";
import { DEFAULT_HTTP_CONFIG, DEFAULT_PATHS_CONFIG } from "./constants";

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
  return { ...DEFAULT_PATHS_CONFIG, ...userConfig?.paths };
}

export function getResolvedOAuthConfig(userConfig: any): OAuthConfig | null {
  return userConfig?.experimental?.oauth || null;
}
