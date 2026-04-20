import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import { runScan } from "./scanner";
import { renderTerminal } from "./reporters/terminal";
import { renderJson } from "./reporters/json";
import { renderSarif } from "./reporters/sarif";
import { ALL_RULES, getRule } from "./rules";
import {
  DEFAULT_BASELINE_PATH,
  loadBaseline,
  partitionByBaseline,
  writeBaseline,
} from "./baseline";
import { listChangedFiles } from "./git";
import {
  ALL_CONCERNS,
  SEVERITY_ORDER,
  type AuditReport,
  type AuditRunOptions,
  type Concern,
  type Severity,
} from "./types";

// Kept in sync with packages/xmcp/package.json#version on release.
const TOOL_VERSION = "0.0.3";

export interface RunAuditResult {
  exitCode: 0 | 1 | 2;
}

export async function runAudit(
  options: AuditRunOptions
): Promise<RunAuditResult> {
  const concerns = parseConcerns(options.concern);
  if (!concerns) {
    process.stderr.write(
      chalk.red(`Unknown --concern value. Use: ${ALL_CONCERNS.join(", ")}\n`)
    );
    return { exitCode: 2 };
  }

  const format = options.format ?? "terminal";
  if (!isValidFormat(format)) {
    process.stderr.write(
      chalk.red(`Unknown --format value. Use: terminal, json, sarif\n`)
    );
    return { exitCode: 2 };
  }

  const disableSet = options.disableRule
    ? new Set(options.disableRule)
    : undefined;
  const enableSet = options.enableRule
    ? new Set(options.enableRule)
    : undefined;

  if (options.since !== undefined && options.changed) {
    process.stderr.write(
      chalk.red("--since and --changed are mutually exclusive\n")
    );
    return { exitCode: 2 };
  }

  const projectRoot = path.resolve(options.path);
  const changedFiles =
    options.since !== undefined || options.changed
      ? listChangedFiles({
          projectRoot,
          since: options.since,
          changed: options.changed,
        })
      : null;
  if (
    (options.since !== undefined || options.changed) &&
    changedFiles === null
  ) {
    process.stderr.write(
      chalk.yellow("Not a git repository — scanning all files\n")
    );
  }

  const report = await runScan({
    projectRoot,
    activeConcerns: concerns,
    disabledRules: disableSet,
    enabledRules: enableSet,
    noDeps: options.noDeps,
    changedFiles,
  });

  if (options.updateBaseline) {
    const target = path.resolve(
      projectRoot,
      options.baseline ?? DEFAULT_BASELINE_PATH
    );
    writeBaseline(target, report.findings, projectRoot, TOOL_VERSION);
    process.stdout.write(
      `Baseline written to ${path.relative(projectRoot, target)} (${report.findings.length} findings)\n`
    );
    return { exitCode: 0 };
  }

  const baseline = resolveBaseline(options, projectRoot);
  let working: AuditReport = report;
  if (baseline) {
    const { fresh, baselined } = partitionByBaseline(
      report.findings,
      baseline,
      projectRoot
    );
    working = { ...report, findings: fresh, baselined: baselined.length };
  }

  const minSeverity = options.severity ?? "info";
  const filtered: AuditReport = {
    ...working,
    findings: working.findings.filter(
      (f) => SEVERITY_ORDER[f.severity] >= SEVERITY_ORDER[minSeverity]
    ),
  };

  const rendered = renderByFormat(filtered, format, options.ci === true);

  if (options.output) {
    fs.writeFileSync(options.output, rendered);
  } else {
    process.stdout.write(rendered);
  }

  const failOn = options.failOn ?? report.resolvedFailOn ?? "high";
  const shouldFail = filtered.findings.some(
    (f) => SEVERITY_ORDER[f.severity] >= SEVERITY_ORDER[failOn]
  );

  return { exitCode: shouldFail ? 1 : 0 };
}

function resolveBaseline(options: AuditRunOptions, projectRoot: string) {
  if (options.baseline === undefined) return null;
  const relative = options.baseline || DEFAULT_BASELINE_PATH;
  const target = path.resolve(projectRoot, relative);
  const baseline = loadBaseline(target);
  if (!baseline) {
    process.stderr.write(
      chalk.yellow(
        `Baseline not found at ${relative} — treating all findings as fresh\n`
      )
    );
  }
  return baseline;
}

function renderByFormat(
  report: AuditReport,
  format: "terminal" | "json" | "sarif",
  ci: boolean
): string {
  if (format === "json") {
    return renderJson(report, { toolVersion: TOOL_VERSION });
  }
  if (format === "sarif") {
    return renderSarif(report, { toolVersion: TOOL_VERSION });
  }
  return renderTerminal(report, { useColor: !ci });
}

export async function runListRules(options: {
  concern?: string[];
  format?: "terminal" | "json";
}): Promise<RunAuditResult> {
  const concerns = parseConcerns(options.concern);
  if (!concerns) {
    process.stderr.write(
      chalk.red(`Unknown --concern value. Use: ${ALL_CONCERNS.join(", ")}\n`)
    );
    return { exitCode: 2 };
  }

  const rules = ALL_RULES.filter((r) => concerns.has(r.meta.concern));

  if (options.format === "json") {
    const payload = {
      tool: { name: "xmcp-audit", version: TOOL_VERSION },
      rules: rules.map((r) => ({
        id: r.meta.id,
        name: r.meta.name,
        description: r.meta.description,
        severity: r.meta.severity,
        concern: r.meta.concern,
        heuristic: r.meta.heuristic === true,
      })),
    };
    process.stdout.write(JSON.stringify(payload, null, 2) + "\n");
    return { exitCode: 0 };
  }

  const byConcern = new Map<Concern, typeof rules>();
  for (const r of rules) {
    const bucket = byConcern.get(r.meta.concern) ?? [];
    bucket.push(r);
    byConcern.set(r.meta.concern, bucket);
  }

  const lines: string[] = [];
  for (const c of ALL_CONCERNS) {
    const bucket = byConcern.get(c);
    if (!bucket || bucket.length === 0) continue;
    lines.push(chalk.bold.underline(c));
    for (const r of bucket) {
      const sev = typeof r.meta.severity === "string" ? r.meta.severity : "?";
      const heuristic = r.meta.heuristic ? chalk.yellow(" ·heuristic") : "";
      lines.push(
        `  ${chalk.cyan(r.meta.id.padEnd(20))} ${chalk.dim(sev.padEnd(9))} ${r.meta.description}${heuristic}`
      );
    }
    lines.push("");
  }
  lines.push(chalk.dim(`${rules.length} rule${rules.length === 1 ? "" : "s"}`));

  process.stdout.write(lines.join("\n") + "\n");
  return { exitCode: 0 };
}

export async function runExplain(ruleId: string): Promise<RunAuditResult> {
  const rule = getRule(ruleId);
  if (!rule) {
    process.stderr.write(chalk.red(`Unknown rule: ${ruleId}\n`));
    return { exitCode: 2 };
  }

  const { meta } = rule;
  const lines = [
    chalk.bold(meta.id) + "  " + chalk.dim(meta.name),
    `${chalk.bold("Severity:")} ${meta.severity}`,
    `${chalk.bold("Concern:")}  ${meta.concern}`,
    meta.heuristic
      ? chalk.yellow("(heuristic — may have false positives)")
      : "",
    "",
    chalk.bold("Description"),
    `  ${meta.description}`,
    "",
    chalk.bold("Why"),
    indent(meta.rationale, 2),
    "",
    chalk.bold("Bad"),
    indent(meta.examples.bad, 2),
    "",
    chalk.bold("Good"),
    indent(meta.examples.good, 2),
  ].filter(Boolean);

  process.stdout.write(lines.join("\n") + "\n");
  return { exitCode: 0 };
}

function parseConcerns(raw?: string[]): Set<Concern> | null {
  if (!raw || raw.length === 0) return new Set(ALL_CONCERNS);
  const out = new Set<Concern>();
  for (const token of raw.flatMap((t) => t.split(","))) {
    const trimmed = token.trim();
    if (!trimmed) continue;
    if (!(ALL_CONCERNS as readonly string[]).includes(trimmed)) {
      return null;
    }
    out.add(trimmed as Concern);
  }
  return out;
}

function isValidFormat(
  format: string
): format is "terminal" | "json" | "sarif" {
  return format === "terminal" || format === "json" || format === "sarif";
}

function indent(text: string, spaces: number): string {
  const prefix = " ".repeat(spaces);
  return text
    .split("\n")
    .map((l) => prefix + l)
    .join("\n");
}

export type { AuditRunOptions, Concern, Severity };
