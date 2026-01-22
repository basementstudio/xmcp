import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import {
  getResolvedHttpConfig,
  getResolvedCorsConfig,
  getResolvedPathsConfig,
  getResolvedTemplateConfig,
  getResolvedExperimentalConfig,
  getResolvedTypescriptConfig,
} from "./utils";
import type { ResolvedHttpConfig, XmcpConfigOutputSchema } from "./index";
import type { HttpTransportConfig } from "./schemas/transport/http";

export function injectHttpVariables(
  httpConfig: HttpTransportConfig | boolean | undefined,
  mode: string
) {
  const resolvedConfig = getResolvedHttpConfig(httpConfig);
  if (!resolvedConfig) {
    return {};
  }

  return {
    HTTP_CONFIG: JSON.stringify({
      port: resolvedConfig.port,
      host: resolvedConfig.host,
      bodySizeLimit: resolvedConfig.bodySizeLimit,
      endpoint: resolvedConfig.endpoint,
      debug: mode === "development",
    }),
  };
}

export type HttpVariables = ReturnType<typeof injectHttpVariables>;

export function injectCorsVariables(httpConfig: ResolvedHttpConfig) {
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
  };
}

export type CorsVariables = ReturnType<typeof injectCorsVariables>;

export function injectPathsVariables(userConfig: XmcpConfigOutputSchema) {
  const pathsConfig = getResolvedPathsConfig(userConfig);

  // Only inject paths that are not null
  const variables: Record<string, string> = {};

  if (pathsConfig.tools !== null) {
    variables.TOOLS_PATH = JSON.stringify(pathsConfig.tools);
  }
  if (pathsConfig.prompts !== null) {
    variables.PROMPTS_PATH = JSON.stringify(pathsConfig.prompts);
  }
  if (pathsConfig.resources !== null) {
    variables.RESOURCES_PATH = JSON.stringify(pathsConfig.resources);
  }

  return variables;
}

export type PathsVariables = ReturnType<typeof injectPathsVariables>;

export function injectStdioVariables(
  stdioConfig: XmcpConfigOutputSchema["stdio"]
) {
  if (!stdioConfig) return {};

  const debug = typeof stdioConfig === "object" ? stdioConfig.debug : false;

  return {
    STDIO_CONFIG: JSON.stringify({
      debug,
    }),
  };
}

export type StdioVariables = ReturnType<typeof injectStdioVariables>;

export function injectTemplateVariables(userConfig: XmcpConfigOutputSchema) {
  const resolvedConfig = getResolvedTemplateConfig(userConfig);

  let homePage = resolvedConfig.homePage;

  if (homePage && homePage.endsWith(".html")) {
    const filePath = resolve(process.cwd(), homePage);
    if (existsSync(filePath)) {
      homePage = readFileSync(filePath, "utf-8");
    } else {
      console.warn(`[xmcp] homePage file not found: ${filePath}`);
      homePage = undefined;
    }
  }

  return {
    TEMPLATE_CONFIG: JSON.stringify({
      ...resolvedConfig,
      homePage,
    }),
  };
}

export type TemplateVariables = ReturnType<typeof injectTemplateVariables>;

export function injectAdapterVariables(userConfig: XmcpConfigOutputSchema) {
  const experimentalConfig = getResolvedExperimentalConfig(userConfig);

  // Only inject if adapter is defined
  if (!experimentalConfig.adapter) {
    return {};
  }

  return {
    ADAPTER_CONFIG: JSON.stringify(experimentalConfig.adapter),
  };
}

export type AdapterVariables = ReturnType<typeof injectAdapterVariables>;

export function injectTypescriptVariables(userConfig: XmcpConfigOutputSchema) {
  const typescriptConfig = getResolvedTypescriptConfig(userConfig);

  return {
    TYPESCRIPT_CONFIG: JSON.stringify(typescriptConfig),
  };
}

export type TypescriptVariables = ReturnType<typeof injectTypescriptVariables>;

export type InjectedVariables =
  | HttpVariables
  | CorsVariables
  | PathsVariables
  | StdioVariables
  | TemplateVariables
  | AdapterVariables
  | TypescriptVariables;
