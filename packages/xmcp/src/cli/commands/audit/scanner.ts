import { buildScanContext } from "./context";
import { runDepsAudit } from "./deps";
import { ALL_RULES } from "./rules";
import { isSuppressed } from "./suppression";
import {
  ALL_CONCERNS,
  type AuditReport,
  type Concern,
  type Finding,
  type Rule,
  type ScanContext,
} from "./types";

export interface ScannerOptions {
  projectRoot: string;
  activeConcerns: Set<Concern>;
  disabledRules?: Set<string>;
  enabledRules?: Set<string>;
  noDeps?: boolean;
}

export async function runScan(options: ScannerOptions): Promise<AuditReport> {
  const start = Date.now();
  const ctx = await buildScanContext({
    projectRoot: options.projectRoot,
    activeConcerns: options.activeConcerns,
    noDeps: options.noDeps,
  });

  const selected = selectRules(ALL_RULES, ctx, options);
  const staticFindings = selected.flatMap((rule) => safeCheck(rule, ctx));
  const depsFindings = await runDepsIfNeeded(ctx);
  const raw = [...staticFindings, ...depsFindings];

  let suppressed = 0;
  const findings: Finding[] = [];
  for (const f of raw) {
    if (isSuppressed(f, ctx.suppressions)) {
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
    durationMs: Date.now() - start,
  };
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
        severity: "info",
        concern: rule.meta.concern,
        message: `${rule.meta.id} failed to execute`,
        file: ctx.projectRoot,
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
    if (options.enabledRules && !options.enabledRules.has(rule.meta.id)) {
      return false;
    }
    return true;
  });
}
