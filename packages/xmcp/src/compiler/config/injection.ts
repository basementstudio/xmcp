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

  const { icons: _, ...templateConfigWithoutIcons } = resolvedConfig;

  return {
    TEMPLATE_CONFIG: JSON.stringify({
      ...templateConfigWithoutIcons,
      homePage,
    }),
  };
}

export type TemplateVariables = ReturnType<typeof injectTemplateVariables>;

const DEFAULT_XMCP_ICON = {
  src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIj48c3ZnIHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiB2aWV3Qm94PSIwIDAgNTEyIDUxMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUxMiIgaGVpZ2h0PSI1MTIiIGZpbGw9ImJsYWNrIj48L3JlY3Q+CjxwYXRoIGQ9Ik04NiAxNDUuNTQySDEwMi40VjE2Mi4yNUg4NlYxNDUuNTQyWk0xMDIuNCA0MjkuNTgzVjM3OS40NThIMTE4LjhWMzYyLjc1SDEzNS4yVjM0Ni4wNDJIMTY4VjMyOS4zMzNIMTg0LjRWMzEyLjYyNUgyMDAuOFYzNDYuMDQySDIzMy42VjM2Mi43NUgyNTBWMzc5LjQ1OEgyNjYuNFYzOTYuMTY3SDI1MFY0MTIuODc1SDIzMy42VjQyOS41ODNIMjE3LjJWNDEyLjg3NUgyMDAuOFYzOTYuMTY3SDE2OFY0MTIuODc1SDE1MS42VjQ0Ni4yOTJIMTY4VjQ2M0gxMzUuMlY0NDYuMjkySDExOC44VjQyOS41ODNIMTAyLjRaTTEwMi40IDE0NS41NDJWMTEyLjEyNUgxMTguOFY5NS40MTY3SDEzNS4yVjc4LjcwODNIMjAwLjhWOTUuNDE2N0gyMzMuNlYxMTIuMTI1SDI1MFYxNDUuNTQySDI2Ni40VjE2Mi4yNUgyODIuOFYxNzguOTU4SDI5OS4yVjE5NS42NjdIMjgyLjhWMjEyLjM3NUgzNjQuOFYyMjkuMDgzSDM0OC40VjI0NS43OTJIMzE1LjZWMjc5LjIwOEgzMzJWMjk1LjkxN0gzNDguNFYzMTIuNjI1SDM2NC44VjM0Ni4wNDJIMzgxLjJWMzYyLjc1SDM5Ny42VjM3OS40NThIMzY0LjhWMzk2LjE2N0gzNDguNFY0MTIuODc1SDMzMlYzOTYuMTY3SDMxNS42VjM2Mi43NUgyOTkuMlYzMjkuMzMzSDI4Mi44VjMxMi42MjVIMjY2LjRWMjc5LjIwOEgyMzMuNlYyNjIuNUgxMTguOFYyNDUuNzkySDEzNS4yVjIyOS4wODNIMTUxLjZWMjEyLjM3NUgyMTcuMlYxOTUuNjY3SDIwMC44VjE2Mi4yNUgxODQuNFYxMjguODMzSDE2OFYxMTIuMTI1SDE1MS42VjEyOC44MzNIMTE4LjhWMTQ1LjU0MkgxMDIuNFpNMjAwLjggMzEyLjYyNVYyOTUuOTE3SDIxNy4yVjMxMi42MjVIMjAwLjhaTTIxNy4yIDI5NS45MTdWMjc5LjIwOEgyMzMuNlYyOTUuOTE3SDIxNy4yWk0yNjYuNCAzNzkuNDU4VjM2Mi43NUgyODIuOFYzNzkuNDU4SDI2Ni40Wk0yNjYuNCAxNDUuNTQyVjEyOC44MzNIMjgyLjhWMTQ1LjU0MkgyNjYuNFpNMjgyLjggMTI4LjgzM1YxMTIuMTI1SDI5OS4yVjc4LjcwODNIMzMyVjk1LjQxNjdIMzY0LjhWNzguNzA4M0gzOTcuNlYxMjguODMzSDM4MS4yVjE0NS41NDJIMzQ4LjRWMTYyLjI1SDMzMlYxNDUuNTQySDMxNS42VjE3OC45NThIMjk5LjJWMTI4LjgzM0gyODIuOFpNMzk3LjYgMzYyLjc1VjM0Ni4wNDJINDE0VjM2Mi43NUgzOTcuNlpNMzk3LjYgNzguNzA4M1Y2Mkg0MTRWNzguNzA4M0gzOTcuNloiIGZpbGw9IndoaXRlIj48L3BhdGg+Cjwvc3ZnPjxzdHlsZT5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBsaWdodCkgeyA6cm9vdCB7IGZpbHRlcjogbm9uZTsgfSB9CkBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGRhcmspIHsgOnJvb3QgeyBmaWx0ZXI6IG5vbmU7IH0gfQo8L3N0eWxlPjwvc3ZnPg==",
  mimeType: "image/svg+xml",
};

const MIME_BY_EXT: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
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

  const faviconCandidates = [
    resolve(process.cwd(), "favicon.ico"),
    resolve(process.cwd(), "public", "favicon.ico"),
    resolve(process.cwd(), "src", "favicon.ico"),
  ];
  const faviconPath = faviconCandidates.find((p) => existsSync(p));
  const defaultIcons = faviconPath
    ? [{ src: faviconPath, mimeType: "image/x-icon" }]
    : [DEFAULT_XMCP_ICON];

  const icons = (templateConfig.icons ?? defaultIcons).map(resolveIconSrc);

  const serverInfo: Record<string, unknown> = {
    name: templateConfig.name,
    version,
    description: templateConfig.description,
    icons,
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
