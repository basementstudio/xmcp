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
  type ScannerEvent,
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
  onEvent?: (event: ScannerEvent) => void;
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

  if (options.onEvent) {
    return runScanWithEvents(start, ctx, selected, ruleById, options);
  }

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

async function runScanWithEvents(
  start: number,
  ctx: ScanContext,
  selected: Rule[],
  ruleById: Map<string, Rule>,
  options: ScannerOptions
): Promise<AuditReport> {
  const onEvent = options.onEvent!;
  const total = selected.length;
  const files = ctx.tools.length + ctx.prompts.length + ctx.resources.length;

  onEvent({
    type: "scan:start",
    totalRules: total,
    files,
    concerns: ALL_CONCERNS.filter((c) => ctx.activeConcerns.has(c)),
    startedAt: start,
  });

  let suppressed = 0;
  const findings: Finding[] = [];

  for (let i = 0; i < selected.length; i++) {
    const rule = selected[i];
    onEvent({
      type: "rule:start",
      ruleId: rule.meta.id,
      concern: rule.meta.concern,
      index: i,
      total,
    });

    const ruleStart = Date.now();
    const raw = safeCheck(rule, ctx);
    let keptInRule = 0;

    for (const f of raw) {
      if (!isFindingInScope(f, ctx, ruleById)) continue;
      const finding = applySeverityOverride(f, ctx);
      if (
        isSuppressed(finding, ctx.suppressions) ||
        isIgnoredByConfig(finding, ctx.projectRoot, ctx.auditConfig)
      ) {
        suppressed += 1;
        continue;
      }
      findings.push(finding);
      keptInRule += 1;
      onEvent({ type: "finding", finding, ruleId: rule.meta.id });
    }

    onEvent({
      type: "rule:complete",
      ruleId: rule.meta.id,
      concern: rule.meta.concern,
      index: i,
      total,
      findingsInRule: keptInRule,
      durationMs: Date.now() - ruleStart,
    });

    // Yield to the event loop so the live renderer can repaint between rules.
    // This is a signal-based yield, not a timed delay.
    await new Promise<void>((resolve) => setImmediate(resolve));
  }

  if (ctx.noDeps) {
    onEvent({ type: "deps:skipped", reason: "disabled" });
  } else if (!ctx.activeConcerns.has("security")) {
    onEvent({ type: "deps:skipped", reason: "no-security-concern" });
  } else if (!ctx.packageManager) {
    onEvent({ type: "deps:skipped", reason: "no-pm" });
  } else {
    const depsStart = Date.now();
    onEvent({ type: "deps:start", packageManager: ctx.packageManager });
    const depsFindings = await runDepsAudit(ctx);
    let depsKept = 0;
    for (const f of depsFindings) {
      if (!isFindingInScope(f, ctx, ruleById)) continue;
      const finding = applySeverityOverride(f, ctx);
      if (
        isSuppressed(finding, ctx.suppressions) ||
        isIgnoredByConfig(finding, ctx.projectRoot, ctx.auditConfig)
      ) {
        suppressed += 1;
        continue;
      }
      findings.push(finding);
      depsKept += 1;
      onEvent({ type: "finding", finding, ruleId: finding.ruleId });
    }
    onEvent({
      type: "deps:complete",
      findingsInPhase: depsKept,
      durationMs: Date.now() - depsStart,
    });
  }

  const durationMs = Date.now() - start;
  onEvent({
    type: "scan:complete",
    durationMs,
    totalFindings: findings.length,
  });

  return {
    projectRoot: ctx.projectRoot,
    activeConcerns: ALL_CONCERNS.filter((c) => ctx.activeConcerns.has(c)),
    findings,
    suppressed,
    baselined: 0,
    resolvedFailOn: ctx.auditConfig.failOn,
    durationMs,
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
