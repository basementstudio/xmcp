import path from "node:path";
import { spawn } from "node:child_process";
import type { Finding, ScanContext, Severity } from "../types";
import { mapNpmOutput } from "./npm";
import { mapPnpmOutput } from "./pnpm";
import { mapYarnOutput } from "./yarn";

// Package-manager audit subprocesses can touch the network; allow enough
// budget for a cold cache while keeping CI predictable.
const DEPS_AUDIT_TIMEOUT_MS = 30_000;

export interface DepsAdvisory {
  package: string;
  severity: Severity;
  title: string;
  range?: string;
  url?: string;
  cves?: string[];
  fixAvailable?: string | boolean;
}

export async function runDepsAudit(ctx: ScanContext): Promise<Finding[]> {
  if (!ctx.packageManager) return [];

  const lockfile = lockfileFor(ctx.projectRoot, ctx.packageManager);
  try {
    const stdout = await runAudit(ctx.packageManager, ctx.projectRoot);
    const advisories = parseAdvisories(ctx.packageManager, stdout);
    return advisories.map((a) => toFinding(a, lockfile));
  } catch (err) {
    return [
      {
        ruleId: "XMCP-DEPS-001",
        severity: "info",
        concern: "security",
        message: `Dependency audit skipped: ${describeError(err)}`,
        file: lockfile,
      },
    ];
  }
}

function toFinding(advisory: DepsAdvisory, file: string): Finding {
  const cves = advisory.cves?.length ? ` (${advisory.cves.join(", ")})` : "";
  return {
    ruleId: "XMCP-DEPS-001",
    severity: advisory.severity,
    concern: "security",
    message: `${advisory.package}${advisory.range ? ` ${advisory.range}` : ""}: ${advisory.title}${cves}`,
    file,
    suggestion:
      typeof advisory.fixAvailable === "string"
        ? `Upgrade to ${advisory.fixAvailable}`
        : advisory.fixAvailable
          ? "A fix is available via the package manager"
          : undefined,
    metadata: {
      package: advisory.package,
      range: advisory.range,
      url: advisory.url,
      cves: advisory.cves,
      fixAvailable: advisory.fixAvailable,
    },
  };
}

function parseAdvisories(
  manager: "npm" | "pnpm" | "yarn",
  stdout: string
): DepsAdvisory[] {
  if (manager === "npm") return mapNpmOutput(stdout);
  if (manager === "pnpm") return mapPnpmOutput(stdout);
  return mapYarnOutput(stdout);
}

function lockfileFor(
  projectRoot: string,
  manager: "npm" | "pnpm" | "yarn"
): string {
  if (manager === "pnpm") return path.join(projectRoot, "pnpm-lock.yaml");
  if (manager === "yarn") return path.join(projectRoot, "yarn.lock");
  return path.join(projectRoot, "package-lock.json");
}

function runAudit(
  manager: "npm" | "pnpm" | "yarn",
  cwd: string
): Promise<string> {
  const [cmd, ...args] = auditCommand(manager);
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { cwd, shell: false });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      proc.kill("SIGKILL");
      reject(new Error(`timed out after ${DEPS_AUDIT_TIMEOUT_MS}ms`));
    }, DEPS_AUDIT_TIMEOUT_MS);

    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    proc.on("close", (code) => {
      clearTimeout(timer);
      // npm/pnpm/yarn audit use non-zero exit when findings exist, but still
      // emit JSON on stdout. Treat any stdout as usable output.
      if (stdout.length > 0) return resolve(stdout);
      if (code === 0) return resolve(stdout);
      reject(new Error(stderr || `${manager} audit exited ${code}`));
    });
  });
}

function auditCommand(manager: "npm" | "pnpm" | "yarn"): string[] {
  if (manager === "npm") return ["npm", "audit", "--json"];
  if (manager === "pnpm") return ["pnpm", "audit", "--json"];
  // yarn v2+ uses `yarn npm audit --json`; v1 uses `yarn audit --json`.
  // Both paths are tried — v2 command first, fallback to v1 if argument error.
  return ["yarn", "npm", "audit", "--json"];
}

function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export { mapNpmOutput, mapPnpmOutput, mapYarnOutput };
