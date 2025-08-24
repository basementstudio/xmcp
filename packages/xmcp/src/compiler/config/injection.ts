import {
  getResolvedHttpConfig,
  getResolvedCorsConfig,
  getResolvedPathsConfig,
  getResolvedOAuthConfig,
  getResolvedTemplateConfig,
} from "./utils";
import { HttpTransportConfig } from "./schemas/transport/http";

export function injectHttpVariables(
  httpConfig: HttpTransportConfig | boolean,
  mode: string
) {
  const resolvedConfig = getResolvedHttpConfig(httpConfig);
  if (!resolvedConfig) return {};

  return {
    HTTP_CONFIG: JSON.stringify({
      port: resolvedConfig.port,
      host: resolvedConfig.host,
      bodySizeLimit: resolvedConfig.bodySizeLimit,
      endpoint: resolvedConfig.endpoint,
      stateless: true,
      debug: mode === "development",
    }),
    // Individual HTTP variables for adapters
    HTTP_DEBUG: JSON.stringify(mode === "development"),
    HTTP_BODY_SIZE_LIMIT: JSON.stringify(resolvedConfig.bodySizeLimit || "10mb"),
  };
}

export type HttpVariables = ReturnType<typeof injectHttpVariables>;

export function injectCorsVariables(httpConfig: HttpTransportConfig | null) {
  const corsConfig = getResolvedCorsConfig(httpConfig);

  return {
    HTTP_CORS_CONFIG: JSON.stringify({
      origin: corsConfig.origin ?? "",
      methods: corsConfig.methods ?? "",
      allowedHeaders: corsConfig.allowedHeaders ?? "",
      exposedHeaders: corsConfig.exposedHeaders ?? "",
      credentials: corsConfig.credentials ?? false,
      maxAge: corsConfig.maxAge ?? 0,
    }),
    // Individual CORS variables for adapters
    HTTP_CORS_ORIGIN: JSON.stringify(corsConfig.origin ?? ""),
    HTTP_CORS_METHODS: JSON.stringify(corsConfig.methods ?? ""),
    HTTP_CORS_ALLOWED_HEADERS: JSON.stringify(corsConfig.allowedHeaders ?? ""),
    HTTP_CORS_EXPOSED_HEADERS: JSON.stringify(corsConfig.exposedHeaders ?? ""),
    HTTP_CORS_CREDENTIALS: JSON.stringify(corsConfig.credentials ?? false),
    HTTP_CORS_MAX_AGE: JSON.stringify(corsConfig.maxAge ?? 0),
  };
}

export type CorsVariables = ReturnType<typeof injectCorsVariables>;

export function injectOAuthVariables(userConfig: any) {
  const oauthConfig = getResolvedOAuthConfig(userConfig);

  return {
    OAUTH_CONFIG: JSON.stringify(oauthConfig),
  };
}

export type OAuthVariables = ReturnType<typeof injectOAuthVariables>;

export function injectPathsVariables(userConfig: any) {
  const pathsConfig = getResolvedPathsConfig(userConfig);

  return {
    TOOLS_PATH: JSON.stringify(pathsConfig.tools),
  };
}

export type PathsVariables = ReturnType<typeof injectPathsVariables>;

export function injectStdioVariables(stdioConfig: any) {
  if (!stdioConfig) return {};

  const debug = typeof stdioConfig === "object" ? stdioConfig.debug : false;

  return {
    STDIO_CONFIG: JSON.stringify({
      debug,
    }),
  };
}

export type StdioVariables = ReturnType<typeof injectStdioVariables>;

export function injectTemplateVariables(userConfig: any) {
  const resolvedConfig = getResolvedTemplateConfig(userConfig);

  return {
    TEMPLATE_CONFIG: JSON.stringify(resolvedConfig),
  };
}

export type TemplateVariables = ReturnType<typeof injectTemplateVariables>;

export type InjectedVariables =
  | HttpVariables
  | CorsVariables
  | OAuthVariables
  | PathsVariables
  | StdioVariables
  | TemplateVariables;
