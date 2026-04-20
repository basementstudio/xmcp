import fs from "node:fs";
import path from "node:path";
import { glob } from "glob";
import { DEFAULT_PATHS } from "../../../compiler/config/schemas/paths";
import type {
  Concern,
  ParsedFile,
  ScanContext,
  SuppressionDirective,
} from "./types";
import { clearParseCache, parseFile } from "./ast/parse";
import { parseSuppressions } from "./suppression";

export interface BuildContextOptions {
  projectRoot: string;
  activeConcerns: Set<Concern>;
  noDeps?: boolean;
}

export async function buildScanContext(
  options: BuildContextOptions
): Promise<ScanContext> {
  const projectRoot = path.resolve(options.projectRoot);
  clearParseCache();

  const jsonConfig = readJsonConfigIfPresent(projectRoot);
  const tsConfigPath = path.join(projectRoot, "xmcp.config.ts");
  const xmcpConfigFile = fs.existsSync(tsConfigPath)
    ? parseFile(tsConfigPath)
    : null;
  const xmcpConfigPresent = jsonConfig !== null || xmcpConfigFile !== null;

  const toolsDir = resolveTypePath(
    projectRoot,
    jsonConfig?.paths?.tools,
    "tools"
  );
  const promptsDir = resolveTypePath(
    projectRoot,
    jsonConfig?.paths?.prompts,
    "prompts"
  );
  const resourcesDir = resolveTypePath(
    projectRoot,
    jsonConfig?.paths?.resources,
    "resources"
  );

  const tools = toolsDir ? await parseDirectory(toolsDir) : [];
  const prompts = promptsDir ? await parseDirectory(promptsDir) : [];
  const resources = resourcesDir ? await parseDirectory(resourcesDir) : [];

  const srcDir = path.join(projectRoot, "src");
  const allSourceFiles = fs.existsSync(srcDir)
    ? await parseDirectory(srcDir)
    : [];

  const packageJsonPath = path.join(projectRoot, "package.json");
  const packageJson = readJsonSafe<Record<string, unknown>>(packageJsonPath);
  const packageManager = detectPackageManager(projectRoot);

  const gitignorePath = path.join(projectRoot, ".gitignore");
  const gitignoreContent = fs.existsSync(gitignorePath)
    ? fs.readFileSync(gitignorePath, "utf8")
    : null;

  const suppressions = collectSuppressions([
    ...tools,
    ...prompts,
    ...resources,
    ...allSourceFiles,
    ...(xmcpConfigFile ? [xmcpConfigFile] : []),
  ]);

  return {
    projectRoot,
    xmcpConfigPresent,
    xmcpConfigFile,
    toolsDir,
    promptsDir,
    resourcesDir,
    tools,
    prompts,
    resources,
    allSourceFiles,
    packageJson,
    packageJsonPath: packageJson ? packageJsonPath : null,
    packageManager,
    gitignoreContent,
    suppressions,
    activeConcerns: options.activeConcerns,
    noDeps: options.noDeps ?? false,
  };
}

function resolveTypePath(
  projectRoot: string,
  value: boolean | string | undefined,
  key: keyof typeof DEFAULT_PATHS
): string | null {
  if (value === false) return null;
  const relative =
    typeof value === "string" && value.length > 0 ? value : DEFAULT_PATHS[key];
  const resolved = path.join(projectRoot, relative);
  return fs.existsSync(resolved) ? resolved : null;
}

async function parseDirectory(dir: string): Promise<ParsedFile[]> {
  const entries = await glob("**/*.{ts,tsx}", {
    cwd: dir,
    absolute: true,
    nodir: true,
    ignore: ["**/node_modules/**", "**/dist/**"],
  });
  return entries.map((absolutePath) => parseFile(absolutePath));
}

function collectSuppressions(
  files: ParsedFile[]
): Map<string, SuppressionDirective[]> {
  const map = new Map<string, SuppressionDirective[]>();
  const seen = new Set<string>();
  for (const file of files) {
    if (seen.has(file.absolutePath)) continue;
    seen.add(file.absolutePath);
    const directives = parseSuppressions(file.source);
    if (directives.length > 0) {
      map.set(file.absolutePath, directives);
    }
  }
  return map;
}

function readJsonConfigIfPresent(projectRoot: string): {
  paths?: {
    tools?: boolean | string;
    prompts?: boolean | string;
    resources?: boolean | string;
  };
} | null {
  const jsonPath = path.join(projectRoot, "xmcp.config.json");
  return readJsonSafe(jsonPath);
}

function readJsonSafe<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

function detectPackageManager(
  projectRoot: string
): "npm" | "pnpm" | "yarn" | null {
  if (fs.existsSync(path.join(projectRoot, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(projectRoot, "yarn.lock"))) return "yarn";
  if (fs.existsSync(path.join(projectRoot, "package-lock.json"))) return "npm";
  return null;
}
