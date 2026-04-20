import path from "node:path";
import type { AuditReport, Concern, Finding, Severity } from "../types";
import { SEVERITY_ORDER } from "../types";

const SCHEMA_VERSION = "1.0";

export interface JsonReport {
  schemaVersion: string;
  tool: { name: string; version: string };
  projectRoot: string;
  activeConcerns: Concern[];
  durationMs: number;
  summary: {
    total: number;
    suppressed: number;
    baselined: number;
    bySeverity: Record<Severity, number>;
    byConcern: Record<Concern, number>;
  };
  findings: Finding[];
}

export interface JsonRenderOptions {
  toolVersion: string;
  pretty?: boolean;
}

export function renderJson(
  report: AuditReport,
  options: JsonRenderOptions
): string {
  const sorted = [...report.findings].sort(compareFindings);
  const relativized = sorted.map((f) => ({
    ...f,
    file: toRelative(report.projectRoot, f.file),
  }));

  const payload: JsonReport = {
    schemaVersion: SCHEMA_VERSION,
    tool: { name: "xmcp-audit", version: options.toolVersion },
    projectRoot: report.projectRoot,
    activeConcerns: report.activeConcerns,
    durationMs: report.durationMs,
    summary: {
      total: relativized.length,
      suppressed: report.suppressed,
      baselined: report.baselined,
      bySeverity: countBy(relativized, (f) => f.severity, [
        "critical",
        "high",
        "medium",
        "low",
        "info",
      ] as const) as Record<Severity, number>,
      byConcern: countBy(relativized, (f) => f.concern, [
        "security",
        "compliance",
        "quality",
        "performance",
      ] as const) as Record<Concern, number>,
    },
    findings: relativized,
  };

  return options.pretty === false
    ? JSON.stringify(payload)
    : JSON.stringify(payload, null, 2) + "\n";
}

function compareFindings(a: Finding, b: Finding): number {
  const sev = SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
  if (sev !== 0) return sev;
  const concern = a.concern.localeCompare(b.concern);
  if (concern !== 0) return concern;
  if (a.file !== b.file) return a.file.localeCompare(b.file);
  const line = (a.line ?? 0) - (b.line ?? 0);
  if (line !== 0) return line;
  return a.ruleId.localeCompare(b.ruleId);
}

function countBy<T, K extends string>(
  items: T[],
  pick: (item: T) => K,
  keys: readonly K[]
): Record<K, number> {
  const out = {} as Record<K, number>;
  for (const k of keys) out[k] = 0;
  for (const item of items) {
    const key = pick(item);
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

function toRelative(projectRoot: string, file: string): string {
  if (!file.startsWith(projectRoot)) return file;
  const rel = path.relative(projectRoot, file);
  return rel || path.basename(file);
}
