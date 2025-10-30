import {
  getResolvedHttpConfig,
  getResolvedCorsConfig,
  getResolvedPathsConfig,
  getResolvedOAuthConfig,
  getResolvedTemplateConfig,
  getResolvedExperimentalConfig,
} from "./utils";
import { HttpTransportConfig } from "./schemas/transport/http";
import fs from "fs";
import path from "path";

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

export function injectReactVariables(userConfig: any) {
  const reactEnabled = userConfig?.experimental?.react ?? false;

  if (!reactEnabled) {
    return {};
  }

  const clientBundlesPath = path.join(process.cwd(), "dist/client");
  const bundles: Record<string, string> = {};

  if (fs.existsSync(clientBundlesPath)) {
    const files = fs.readdirSync(clientBundlesPath);
    for (const file of files) {
      if (file.endsWith(".bundle.js")) {
        const toolName = file.replace(".bundle.js", "");
        const bundleContent = fs.readFileSync(
          path.join(clientBundlesPath, file),
          "utf-8"
        );
        bundles[toolName] = bundleContent;
      }
    }
  }

  return {
    INJECTED_CLIENT_BUNDLES: JSON.stringify(bundles),
  };
}

export type ReactVariables = ReturnType<typeof injectReactVariables>;

export type InjectedVariables =
  | HttpVariables
  | CorsVariables
  | OAuthVariables
  | PathsVariables
  | StdioVariables
  | TemplateVariables
  | ReactVariables;
