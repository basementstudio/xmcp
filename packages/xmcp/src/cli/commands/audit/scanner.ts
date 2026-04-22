import { buildScanContext } from "./context";
import { runDepsAudit } from "./deps";
import { ALL_RULES } from "./rules";
import { isIgnoredByConfig, isSuppressed } from "./suppression";
import {
  ALL_CONCERNS,
  type AuditReport,
  type Concern,
  type Finding,
  type Rule,
  type ScanContext,
  type Severity,
} from "./types";

export interface ScannerOptions {
  projectRoot: string;
  activeConcerns: Set<Concern>;
  disabledRules?: Set<string>;
  enabledRules?: Set<string>;
  noHeuristics?: boolean;
  noDeps?: boolean;
  strictExecutionErrors?: boolean;
  changedFiles?: Set<string> | null;
}

export async function runScan(options: ScannerOptions): Promise<AuditReport> {
  const start = Date.now();
  const ctx = await buildScanContext({
    projectRoot: options.projectRoot,
    activeConcerns: options.activeConcerns,
    noDeps: options.noDeps,
    changedFiles: options.changedFiles,
  });
  ctx.strictExecutionErrors = options.strictExecutionErrors ?? false;

  const selected = selectRules(ALL_RULES, ctx, options);
  const ruleById = new Map(selected.map((r) => [r.meta.id, r] as const));
  const staticFindings = selected.flatMap((rule) => safeCheck(rule, ctx));
  const depsFindings = await runDepsIfNeeded(ctx);
  const raw = [...staticFindings, ...depsFindings]
    .filter((f) => isFindingInScope(f, ctx, ruleById))
    .map((f) => applySeverityOverride(f, ctx));

  let suppressed = 0;
  const findings: Finding[] = [];
  for (const f of raw) {
    if (
      isSuppressed(f, ctx.suppressions) ||
      isIgnoredByConfig(f, ctx.projectRoot, ctx.auditConfig)
    ) {
      suppressed += 1;
    } else {
      findings.push(f);
    }
  }

  return {
    projectRoot: ctx.projectRoot,
    activeConcerns: ALL_CONCERNS.filter((c) => ctx.activeConcerns.has(c)),
    findings,
    suppressed,
    baselined: 0,
    resolvedFailOn: ctx.auditConfig.failOn,
    durationMs: Date.now() - start,
  };
}

function applySeverityOverride(finding: Finding, ctx: ScanContext): Finding {
  const override = ctx.auditConfig.severity[finding.ruleId];
  if (!override || override === "off") return finding;
  if (override === finding.severity) return finding;
  return { ...finding, severity: override as Severity };
}

function isFindingInScope(
  finding: Finding,
  ctx: ScanContext,
  ruleById: Map<string, Rule>
): boolean {
  if (!ctx.changedFiles) return true;
  const rule = ruleById.get(finding.ruleId);
  // Unknown rule (e.g. deps audit): default to project-scope — safer than
  // silently dropping findings.
  if (!rule || rule.meta.projectScope) return true;
  return ctx.changedFiles.has(finding.file);
}

async function runDepsIfNeeded(ctx: ScanContext): Promise<Finding[]> {
  if (ctx.noDeps) return [];
  if (!ctx.activeConcerns.has("security")) return [];
  if (!ctx.packageManager) return [];
  return runDepsAudit(ctx);
}

function safeCheck(rule: Rule, ctx: ScanContext): Finding[] {
  try {
    return rule.check(ctx);
  } catch {
    return [
      {
        ruleId: rule.meta.id,
        severity: ctx.strictExecutionErrors ? "high" : "info",
        concern: rule.meta.concern,
        message: `${rule.meta.id} failed to execute`,
        file: ctx.projectRoot,
        metadata: {
          executionError: true,
        },
      },
    ];
  }
}

function selectRules(
  rules: Rule[],
  ctx: ScanContext,
  options: ScannerOptions
): Rule[] {
  return rules.filter((rule) => {
    if (!ctx.activeConcerns.has(rule.meta.concern)) return false;
    if (options.disabledRules?.has(rule.meta.id)) return false;
    if (options.noHeuristics && rule.meta.heuristic) return false;
    if (options.enabledRules) {
      return options.enabledRules.has(rule.meta.id);
    }
    if (ctx.auditConfig.severity[rule.meta.id] === "off") return false;
    return true;
  });
}
