import { readFileSync } from "fs";
import { createRequire } from "module";
import path from "path";

const projectRequire = createRequire(path.join(process.cwd(), "package.json"));

const runtimeConfig = projectRequire(
  "xmcp/config"
) as typeof import("xmcp/config");

export const {
  configSchema,
  getResolvedCorsConfig,
  getResolvedExperimentalConfig,
  getResolvedHttpConfig,
  getResolvedPathsConfig,
  getResolvedStdioConfig,
  getResolvedTemplateConfig,
  getResolvedTypescriptConfig,
} = runtimeConfig;

export type {
  CorsConfig,
  HttpTransportConfig,
  ResolvedHttpConfig,
  TemplateConfig,
  XmcpConfigOutputSchema,
} from "xmcp/config";

export function getRuntimePackageJsonPath(): string {
  return projectRequire.resolve("xmcp/package.json");
}

export function getRuntimePackageRoot(): string {
  return path.dirname(getRuntimePackageJsonPath());
}

export function getRuntimeDirectoryPath(): string {
  return path.join(getRuntimePackageRoot(), "dist", "runtime");
}

export function getRuntimeVersion(): string {
  const packageJson = JSON.parse(
    readFileSync(getRuntimePackageJsonPath(), "utf-8")
  ) as { version?: string };
  return packageJson.version ?? "unknown";
}

function parseVersion(version: string): [number, number] | null {
  const match = /^(\d+)\.(\d+)\./.exec(version);
  return match ? [Number(match[1]), Number(match[2])] : null;
}

export function assertCompatibleRuntimeVersion(compilerVersion: string): void {
  const runtimeVersion = getRuntimeVersion();
  const compilerParts = parseVersion(compilerVersion);
  const runtimeParts = parseVersion(runtimeVersion);

  if (!compilerParts || !runtimeParts) {
    return;
  }

  const [compilerMajor, compilerMinor] = compilerParts;
  const [runtimeMajor, runtimeMinor] = runtimeParts;
  const compatible =
    compilerMajor === runtimeMajor &&
    (compilerMajor > 0 || compilerMinor === runtimeMinor);

  if (!compatible) {
    throw new Error(
      `Incompatible xmcp packages: @xmcp-dev/compiler ${compilerVersion} cannot compile xmcp ${runtimeVersion}. Install matching versions of both packages.`
    );
  }
}
