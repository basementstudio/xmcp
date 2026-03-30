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
  const silent = typeof stdioConfig === "object" ? stdioConfig.silent : false;

  return {
    STDIO_CONFIG: JSON.stringify({
      debug,
      silent,
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

  const { icons: _, ...templateConfigWithoutIcons } = resolvedConfig;

  return {
    TEMPLATE_CONFIG: JSON.stringify({
      ...templateConfigWithoutIcons,
      homePage,
    }),
  };
}

export type TemplateVariables = ReturnType<typeof injectTemplateVariables>;

const MIME_BY_EXT: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

function resolveIconSrc(icon: {
  src: string;
  mimeType?: string;
  sizes?: string[];
  theme?: string;
}) {
  if (/^https?:\/\/|^data:/.test(icon.src)) return icon;

  const filePath = resolve(process.cwd(), icon.src);
  if (!existsSync(filePath)) {
    console.warn(`[xmcp] icon file not found: ${filePath}`);
    return icon;
  }

  const ext = icon.src.substring(icon.src.lastIndexOf(".")).toLowerCase();
  const mime = icon.mimeType ?? MIME_BY_EXT[ext] ?? "application/octet-stream";
  const data = readFileSync(filePath);
  return { ...icon, src: `data:${mime};base64,${data.toString("base64")}` };
}

export function injectServerInfoVariables(userConfig: XmcpConfigOutputSchema) {
  const templateConfig = getResolvedTemplateConfig(userConfig);

  let version = "0.0.1";
  try {
    const pkg = JSON.parse(
      readFileSync(resolve(process.cwd(), "package.json"), "utf-8")
    );
    if (pkg.version) version = pkg.version;
  } catch (err) {
    console.warn(`[xmcp] Could not read version from package.json:`, err);
  }

  const icons = (templateConfig.icons ?? []).map(resolveIconSrc);

  const serverInfo: Record<string, unknown> = {
    name: templateConfig.name,
    version,
    description: templateConfig.description,
    icons,
    instructions: templateConfig.instructions,
  };

  return {
    SERVER_INFO: JSON.stringify(serverInfo),
  };
}

export type ServerInfoVariables = ReturnType<typeof injectServerInfoVariables>;

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
  | ServerInfoVariables
  | AdapterVariables
  | TypescriptVariables;
