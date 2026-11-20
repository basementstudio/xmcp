import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// Handled by the runtime CLI shim, before the compiler lookup: 0.x projects
// do not have @xmcp-dev/compiler installed, so `npx xmcp@latest upgrade` must
// work without it.

const XMCP_VERSION: string = require("../../package.json").version;

export const UPGRADE_COMMANDS = ["upgrade", "update", "up"];
export const UPGRADE_GUIDE_URL =
  "https://xmcp.dev/docs/getting-started/upgrading";

const MIN_NODE = "22.12.0";
// Matches the create-xmcp-app template. With zod 3.x, InferSchema fails type
// checking (TS2589) in xmcp 1.x builds.
const ZOD_RANGE = "^4.0.0";
const DEPENDENCY_FIELDS = ["dependencies", "devDependencies"] as const;
const SOURCE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".mts",
  ".cts",
]);
const SKIPPED_DIRECTORIES = new Set(["node_modules", "dist", ".xmcp", ".git"]);
const MAX_SCANNED_FILES = 5000;

type PackageManager = "npm" | "pnpm" | "yarn" | "bun";
type Dependencies = Record<string, string>;

export interface PackageJson {
  dependencies?: Dependencies;
  devDependencies?: Dependencies;
  engines?: Record<string, string>;
  [key: string]: unknown;
}

export interface UpgradePlan {
  packageJson: PackageJson;
  changes: string[];
  warnings: string[];
}

type Version = [number, number, number];

function parseVersion(value: string): Version | null {
  const match = value.match(/(\d+)(?:\.(\d+|x|\*))?(?:\.(\d+|x|\*))?/);
  if (!match) return null;
  const part = (raw?: string) => (raw && /^\d+$/.test(raw) ? Number(raw) : 0);
  return [Number(match[1]), part(match[2]), part(match[3])];
}

function compareVersions(a: Version, b: Version): number {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

function isProtocolRange(range: string): boolean {
  return /^(workspace|catalog|link|file|portal|git|github|npm):/.test(range);
}

// Dist-tags ("latest", "canary") and protocol ranges are left as the user set
// them; only plain semver ranges below the minimum are rewritten.
function isOlderThan(range: string, minimum: Version): boolean {
  if (isProtocolRange(range)) return false;
  const parsed = parseVersion(range);
  return parsed !== null && compareVersions(parsed, minimum) < 0;
}

/**
 * Computes the package.json edits for the current xmcp release. Pure so it can
 * be tested without touching the filesystem or the network.
 */
export function planUpgrade(
  original: PackageJson,
  targetVersion: string = XMCP_VERSION
): UpgradePlan {
  const packageJson: PackageJson = structuredClone(original);
  const changes: string[] = [];
  const warnings: string[] = [];
  const target = parseVersion(targetVersion)!;

  const field = DEPENDENCY_FIELDS.find(
    (name) => packageJson[name]?.xmcp !== undefined
  );
  if (!field) {
    throw new Error(
      "No xmcp dependency found in package.json. Run this command from your xmcp project folder."
    );
  }

  const deps = packageJson[field]!;
  const currentRange = deps.xmcp;
  const nextRange = `^${targetVersion}`;
  if (isOlderThan(currentRange, target)) {
    deps.xmcp = nextRange;
    changes.push(`xmcp: ${currentRange} -> ${nextRange}`);
  } else if (!parseVersion(currentRange) || isProtocolRange(currentRange)) {
    warnings.push(
      `xmcp uses "${currentRange}", so its version was left unchanged.`
    );
  }

  const compilerRange = `^${target[0]}.${target[1]}.0`;
  const compilerField = DEPENDENCY_FIELDS.find(
    (name) => packageJson[name]?.["@xmcp-dev/compiler"] !== undefined
  );
  if (!compilerField) {
    packageJson.devDependencies = packageJson.devDependencies ?? {};
    packageJson.devDependencies["@xmcp-dev/compiler"] = compilerRange;
    changes.push(`@xmcp-dev/compiler: added ${compilerRange} (dev)`);
  } else {
    const compilerDeps = packageJson[compilerField]!;
    const currentCompiler = compilerDeps["@xmcp-dev/compiler"];
    if (isOlderThan(currentCompiler, parseVersion(compilerRange)!)) {
      compilerDeps["@xmcp-dev/compiler"] = compilerRange;
      changes.push(
        `@xmcp-dev/compiler: ${currentCompiler} -> ${compilerRange}`
      );
    }
  }

  const zodField = DEPENDENCY_FIELDS.find(
    (name) => packageJson[name]?.zod !== undefined
  );
  if (!zodField) {
    deps.zod = ZOD_RANGE;
    changes.push(`zod: added ${ZOD_RANGE}`);
  } else {
    const zodDeps = packageJson[zodField]!;
    const currentZod = zodDeps.zod;
    if (isOlderThan(currentZod, [4, 0, 0])) {
      zodDeps.zod = ZOD_RANGE;
      changes.push(`zod: ${currentZod} -> ${ZOD_RANGE}`);
      warnings.push(
        "zod moved to v4. Most schemas work unchanged; see https://zod.dev/v4/changelog if the build reports zod errors."
      );
    }
  }

  for (const name of DEPENDENCY_FIELDS) {
    if (packageJson[name]?.["swc-loader"] !== undefined) {
      delete packageJson[name]!["swc-loader"];
      changes.push("swc-loader: removed (xmcp bundles with Rspack)");
    }
  }

  const engine = packageJson.engines?.node;
  if (engine) {
    const minimum = parseVersion(engine);
    if (minimum && compareVersions(minimum, parseVersion(MIN_NODE)!) < 0) {
      packageJson.engines!.node = ">=22.12";
      changes.push(`engines.node: ${engine} -> >=22.12`);
    }
  }

  return { packageJson, changes, warnings };
}

function listSourceFiles(directory: string, files: string[] = []): string[] {
  if (files.length >= MAX_SCANNED_FILES || !fs.existsSync(directory)) {
    return files;
  }
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (files.length >= MAX_SCANNED_FILES) break;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRECTORIES.has(entry.name)) {
        listSourceFiles(fullPath, files);
      }
    } else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Finds code-level changes the command does not rewrite. Text matching only:
 * a hint may be a false positive, so it never edits source files.
 */
export function scanProject(
  projectPath: string,
  packageJson: PackageJson,
  nodeVersion: string = process.versions.node
): string[] {
  const warnings: string[] = [];
  const declared = (name: string) =>
    DEPENDENCY_FIELDS.some((field) => packageJson[field]?.[name] !== undefined);
  const relative = (file: string) => path.relative(projectPath, file);

  const configFile = ["ts", "mts", "js", "mjs", "cjs", "json"]
    .map((extension) => path.join(projectPath, `xmcp.config.${extension}`))
    .find((file) => fs.existsSync(file));
  const config = configFile ? fs.readFileSync(configFile, "utf8") : "";

  // The compiler requires the default tools/prompts/resources folders to
  // exist unless the config sets a path. 0.2.x templates had no src/resources.
  for (const type of ["tools", "prompts", "resources"]) {
    const configured = new RegExp(`\\b${type}\\s*:`).test(config);
    if (!configured && !fs.existsSync(path.join(projectPath, "src", type))) {
      warnings.push(
        `src/${type} does not exist and xmcp build requires it. Create the folder, or set paths: { ${type}: false } in xmcp.config.`
      );
    }
  }

  if (configFile) {
    if (/\bwebpack\s*:/.test(config)) {
      warnings.push(
        `${relative(configFile)}: rename the "webpack" option to "bundler" (it now receives Rspack options).`
      );
    }
    if (/\boauth\s*:|OAuthConfigOptions/.test(config)) {
      warnings.push(
        `${relative(configFile)}: the built-in "experimental.oauth" option was removed. Use an auth plugin instead.`
      );
    }
  }

  const findings = new Map<string, Set<string>>();
  const note = (message: string, file: string) => {
    const files = findings.get(message) ?? new Set<string>();
    files.add(relative(file));
    findings.set(message, files);
  };
  for (const file of listSourceFiles(path.join(projectPath, "src"))) {
    const source = fs.readFileSync(file, "utf8");
    if (
      source.includes("@modelcontextprotocol/sdk") &&
      !declared("@modelcontextprotocol/sdk")
    ) {
      note(
        "imports @modelcontextprotocol/sdk, which xmcp no longer installs. Import from @modelcontextprotocol/server instead, or add the SDK as a dependency.",
        file
      );
    }
    if (/\.elicit\s*\(/.test(source)) {
      note(
        "uses extra.elicit(), which throws for 2026-07-28 clients. Return inputRequired(...) instead.",
        file
      );
    }
    if (/["']xmcp\/src\//.test(source)) {
      note(
        'imports from "xmcp/src/...", which is no longer published. Import from "xmcp" instead.',
        file
      );
    }
    if (/["']xmcp\/cloudflare["']/.test(source) && !declared("jose")) {
      note(
        "imports xmcp/cloudflare. Add jose if you use its JWT middleware.",
        file
      );
    }
  }
  for (const [message, files] of findings) {
    const list = [...files];
    const shown = list.slice(0, 3).join(", ");
    const more = list.length > 3 ? ` and ${list.length - 3} more` : "";
    warnings.push(`${shown}${more}: ${message}`);
  }

  const skillsPath = path.join(projectPath, "src", "skills");
  if (fs.existsSync(skillsPath)) {
    const hasSkill = fs
      .readdirSync(skillsPath, { withFileTypes: true })
      .some(
        (entry) =>
          entry.isDirectory() &&
          fs.existsSync(path.join(skillsPath, entry.name, "SKILL.md"))
      );
    if (!hasSkill) {
      warnings.push(
        "src/skills is now loaded as agent skills. Set paths.skills to false in xmcp.config if that folder is for something else."
      );
    }
  }

  const node = parseVersion(nodeVersion);
  if (node && compareVersions(node, parseVersion(MIN_NODE)!) < 0) {
    warnings.push(
      `Node.js ${nodeVersion} is too old for xmcp ${XMCP_VERSION}. Use Node.js 22.12 or newer.`
    );
  }

  return warnings;
}

// Mirrors init-xmcp's lockfile check; the runtime package cannot depend on
// init-xmcp or the compiler.
export function detectPackageManager(projectPath: string): PackageManager {
  const has = (file: string) => fs.existsSync(path.join(projectPath, file));
  if (has("bun.lock") || has("bun.lockb")) return "bun";
  if (has("pnpm-lock.yaml")) return "pnpm";
  if (has("yarn.lock")) return "yarn";
  return "npm";
}

const HELP = `Usage: npx xmcp@latest upgrade [options]

Upgrades the xmcp project in the current folder to xmcp ${XMCP_VERSION}.

Options:
  --dry-run     Show the changes without writing package.json or installing
  --no-install  Update package.json but skip installing dependencies
  -h, --help    Show this help

Guide: ${UPGRADE_GUIDE_URL}`;

export function runUpgrade(
  args: string[],
  projectPath: string = process.cwd()
): number {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(HELP);
    return 0;
  }
  const unknown = args.filter(
    (arg) => !["--dry-run", "--no-install"].includes(arg)
  );
  if (unknown.length > 0) {
    console.error(`Unknown option: ${unknown.join(" ")}\n\n${HELP}`);
    return 1;
  }
  const dryRun = args.includes("--dry-run");
  const skipInstall = dryRun || args.includes("--no-install");

  const packageJsonPath = path.join(projectPath, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    console.error(
      "No package.json found. Run this command from your xmcp project folder."
    );
    return 1;
  }
  const raw = fs.readFileSync(packageJsonPath, "utf8");
  const original = JSON.parse(raw) as PackageJson;

  let plan: UpgradePlan;
  try {
    plan = planUpgrade(original);
  } catch (error) {
    console.error((error as Error).message);
    return 1;
  }
  const warnings = [
    ...plan.warnings,
    ...scanProject(projectPath, plan.packageJson),
  ];

  if (plan.changes.length === 0) {
    console.log(
      `package.json already matches xmcp ${XMCP_VERSION}. For the newest release, run: npx xmcp@latest upgrade`
    );
  } else {
    console.log(
      `${dryRun ? "Would update" : "Updating"} package.json for xmcp ${XMCP_VERSION}:`
    );
    for (const change of plan.changes) console.log(`  ${change}`);
  }

  if (!dryRun && plan.changes.length > 0) {
    const indent = raw.match(/^[ \t]+(?=")/m)?.[0] ?? 2;
    const newline = raw.endsWith("\n") ? "\n" : "";
    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(plan.packageJson, null, indent) + newline
    );
  }

  if (!skipInstall && plan.changes.length > 0) {
    const packageManager = detectPackageManager(projectPath);
    try {
      execSync(`${packageManager} install`, {
        cwd: projectPath,
        stdio: "inherit",
      });
    } catch {
      console.error(
        `\n${packageManager} install failed. package.json was updated; fix the error above and install again.`
      );
      return 1;
    }
  }

  if (warnings.length > 0) {
    console.log("\nCheck these before building:");
    for (const warning of warnings) console.log(`  - ${warning}`);
  }
  if (plan.changes.length > 0 || warnings.length > 0) {
    console.log(`\nUpgrade guide: ${UPGRADE_GUIDE_URL}`);
  }
  return 0;
}
