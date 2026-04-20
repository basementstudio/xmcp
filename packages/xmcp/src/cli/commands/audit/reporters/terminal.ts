import path from "node:path";
import chalk from "chalk";
import type { AuditReport, Concern, Finding, Severity } from "../types";
import { SEVERITY_ORDER } from "../types";

const SEVERITY_BADGE: Record<Severity, (text: string) => string> = {
  critical: (t) => chalk.bgRed.white.bold(` ${t} `),
  high: (t) => chalk.red.bold(t),
  medium: (t) => chalk.yellow(t),
  low: (t) => chalk.blue(t),
  info: (t) => chalk.gray(t),
};

const CONCERN_LABEL: Record<Concern, string> = {
  security: "security",
  compliance: "compliance",
  quality: "quality",
  performance: "performance",
};

export interface TerminalRenderOptions {
  useColor: boolean;
}

export function renderTerminal(
  report: AuditReport,
  options: TerminalRenderOptions = { useColor: true }
): string {
  if (!options.useColor) {
    chalk.level = 0;
  }

  const { findings } = report;
  if (findings.length === 0) {
    const tail = summarizeHidden(report);
    return `${chalk.green("✓")} No findings.${tail ? ` (${tail})` : ""}\n`;
  }

  const sorted = [...findings].sort(compareFindings);
  const grouped = groupByConcernAndFile(sorted);
  const lines: string[] = [];

  for (const concern of report.activeConcerns) {
    const files = grouped.get(concern);
    if (!files || files.size === 0) continue;

    lines.push(chalk.bold.underline(CONCERN_LABEL[concern]));
    for (const [file, fileFindings] of files) {
      const rel = path.relative(report.projectRoot, file) || file;
      lines.push(chalk.dim(`  ${rel}`));
      for (const f of fileFindings) {
        lines.push(renderFinding(f));
      }
    }
    lines.push("");
  }

  lines.push(renderSummary(report));
  return lines.join("\n") + "\n";
}

function renderFinding(f: Finding): string {
  const badge = SEVERITY_BADGE[f.severity](f.severity);
  const location =
    f.line !== undefined ? chalk.dim(`:${f.line}:${f.column ?? 1}`) : "";
  const parts = [
    `    ${badge} ${f.message} ${chalk.dim(`[${f.ruleId}]`)}${location}`,
  ];
  if (f.suggestion) {
    parts.push(chalk.dim(`      → ${f.suggestion}`));
  }
  return parts.join("\n");
}

function renderSummary(report: AuditReport): string {
  const counts = countBySeverity(report.findings);
  const parts: string[] = [];
  (Object.keys(counts) as Severity[]).forEach((sev) => {
    if (counts[sev] === 0) return;
    parts.push(SEVERITY_BADGE[sev](`${counts[sev]} ${sev}`));
  });
  const summary = `${report.findings.length} finding${report.findings.length === 1 ? "" : "s"} (${parts.join(", ")})`;
  const tail = summarizeHidden(report);
  return `${summary}${tail ? chalk.dim(` • ${tail}`) : ""}`;
}

function summarizeHidden(report: AuditReport): string {
  const bits: string[] = [];
  if (report.suppressed > 0) bits.push(`${report.suppressed} suppressed`);
  if (report.baselined > 0) bits.push(`${report.baselined} baselined`);
  return bits.join(", ");
}

function countBySeverity(findings: Finding[]): Record<Severity, number> {
  const counts: Record<Severity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };
  for (const f of findings) counts[f.severity]++;
  return counts;
}

function compareFindings(a: Finding, b: Finding): number {
  const sev = SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
  if (sev !== 0) return sev;
  if (a.file !== b.file) return a.file.localeCompare(b.file);
  return (a.line ?? 0) - (b.line ?? 0);
}

function groupByConcernAndFile(
  findings: Finding[]
): Map<Concern, Map<string, Finding[]>> {
  const out = new Map<Concern, Map<string, Finding[]>>();
  for (const f of findings) {
    let files = out.get(f.concern);
    if (!files) {
      files = new Map();
      out.set(f.concern, files);
    }
    const existing = files.get(f.file);
    if (existing) {
      existing.push(f);
    } else {
      files.set(f.file, [f]);
    }
  }
  return out;
}
