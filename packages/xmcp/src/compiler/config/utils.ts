import {
  HttpTransportConfig,
  CorsConfig,
  OAuthConfig,
  StdioTransportConfig,
  TemplateConfig,
  TypescriptConfig,
} from "./schemas";
import {
  DEFAULT_HTTP_CONFIG,
  DEFAULT_PATHS_CONFIG,
  DEFAULT_STDIO_CONFIG,
  DEFAULT_TEMPLATE_CONFIG,
  DEFAULT_TYPESCRIPT_CONFIG,
} from "./constants";

export type ResolvedHttpConfig = typeof DEFAULT_HTTP_CONFIG;

export function getResolvedHttpConfig(
  userConfig: HttpTransportConfig | undefined
): ResolvedHttpConfig | null {
  if (typeof userConfig === "boolean") {
    return userConfig ? DEFAULT_HTTP_CONFIG : null;
  }
  if (typeof userConfig === "object") {
    return { ...DEFAULT_HTTP_CONFIG, ...userConfig } as ResolvedHttpConfig;
  }
  return null;
}

export function getResolvedCorsConfig(
  httpConfig: ResolvedHttpConfig | null
): CorsConfig {
  if (httpConfig?.cors) {
    return { ...DEFAULT_HTTP_CONFIG.cors, ...httpConfig.cors };
  }
  return DEFAULT_HTTP_CONFIG.cors;
}

export function getResolvedPathsConfig(userConfig: any): {
  tools: string | null;
  prompts: string | null;
  resources: string | null;
} {
  const userPaths = userConfig?.paths;
  if (!userPaths) {
    return {
      tools: DEFAULT_PATHS_CONFIG.tools,
      prompts: DEFAULT_PATHS_CONFIG.prompts,
      resources: DEFAULT_PATHS_CONFIG.resources,
    };
  }

  const resolvedPaths: {
    tools: string | null;
    prompts: string | null;
    resources: string | null;
  } = {
    tools: DEFAULT_PATHS_CONFIG.tools,
    prompts: DEFAULT_PATHS_CONFIG.prompts,
    resources: DEFAULT_PATHS_CONFIG.resources,
  };

  // Handle tools path
  if (typeof userPaths.tools === "boolean") {
    resolvedPaths.tools = userPaths.tools ? DEFAULT_PATHS_CONFIG.tools : null;
  } else if (typeof userPaths.tools === "string") {
    resolvedPaths.tools = userPaths.tools;
  }

  // Handle prompts path
  if (typeof userPaths.prompts === "boolean") {
    resolvedPaths.prompts = userPaths.prompts
      ? DEFAULT_PATHS_CONFIG.prompts
      : null;
  } else if (typeof userPaths.prompts === "string") {
    resolvedPaths.prompts = userPaths.prompts;
  }

  // Handle resources path
  if (typeof userPaths.resources === "boolean") {
    resolvedPaths.resources = userPaths.resources
      ? DEFAULT_PATHS_CONFIG.resources
      : null;
  } else if (typeof userPaths.resources === "string") {
    resolvedPaths.resources = userPaths.resources;
  }

  return resolvedPaths;
}

export function getResolvedOAuthConfig(userConfig: any): OAuthConfig | null {
  return userConfig?.experimental?.oauth || null;
}

export function getResolvedStdioConfig(
  userConfig: any
): StdioTransportConfig | null {
  return userConfig?.stdio || DEFAULT_STDIO_CONFIG;
}

export function getResolvedTemplateConfig(
  userConfig: any
): TemplateConfig | null {
  const userTemplate = userConfig?.template;
  if (!userTemplate) {
    return DEFAULT_TEMPLATE_CONFIG;
  }
  return { ...DEFAULT_TEMPLATE_CONFIG, ...userTemplate };
}

export function getResolvedExperimentalConfig(userConfig: any): {
  adapter: string | undefined;
} {
  const experimental = userConfig?.experimental;
  return {
    adapter: experimental?.adapter,
  };
}

export function getResolvedTypescriptConfig(
  userConfig: any
): TypescriptConfig | null {
  const typescript = userConfig?.typescript;
  if (!typescript) {
    return DEFAULT_TYPESCRIPT_CONFIG;
  }
  return { ...DEFAULT_TYPESCRIPT_CONFIG, ...typescript };
}
