import path from "node:path";
import chalk from "chalk";
import { createLogUpdate } from "log-update";
import {
  blueDiamond,
  greenCheck,
  redCross,
  xmcpLogo,
  yellowArrow,
} from "../../../../utils/cli-icons";
import { renderBar } from "./progress-bar";
import type { AuditReport, Finding, ScannerEvent, Severity } from "../types";

const SEVERITY_BADGE: Record<Severity, (text: string) => string> = {
  critical: (t) => chalk.bgRed.white.bold(` ${t} `),
  high: (t) => chalk.red.bold(t),
  medium: (t) => chalk.yellow(t),
  low: (t) => chalk.blue(t),
  info: (t) => chalk.gray(t),
};

export interface LiveReporter {
  handleEvent(event: ScannerEvent): void;
  finish(report: AuditReport): void;
}

export interface LiveReporterOptions {
  projectRoot: string;
  out?: NodeJS.WriteStream;
}

export function createLiveReporter(options: LiveReporterOptions): LiveReporter {
  const out = options.out ?? process.stdout;
  const updater = createLogUpdate(out);

  let rulesTotal = 0;
  let rulesDone = 0;
  let totalFindings = 0;
  let currentRule = "";
  let scanStartedAt = Date.now();
  let depsPhase: "none" | "running" | "done" | "skipped" = "none";
  let depsPm: "npm" | "pnpm" | "yarn" | null = null;
  let lastFile: string | null = null;

  function elapsed(): string {
    const sec = (Date.now() - scanStartedAt) / 1000;
    return `${sec.toFixed(1)}s`;
  }

  function renderStatus(): string {
    if (depsPhase === "running" && depsPm) {
      const fullBar = chalk.cyan(renderBar(1, 1));
      return `  ${fullBar}  ${chalk.bold(
        `Auditing ${depsPm} dependencies`
      )}  ${chalk.dim(`· ${elapsed()}`)}`;
    }
    if (rulesTotal === 0) {
      return chalk.dim(`  ${greenCheck} Preparing scan…`);
    }
    const bar = renderBar(rulesDone, rulesTotal);
    const coloredBar =
      rulesDone === rulesTotal ? chalk.green(bar) : chalk.cyan(bar);
    const progress = chalk.bold(`${rulesDone}/${rulesTotal} rules`);
    const rule = currentRule ? chalk.dim(` · ${currentRule}`) : "";
    const findings =
      totalFindings > 0
        ? chalk.dim(
            ` · ${totalFindings} finding${totalFindings === 1 ? "" : "s"}`
          )
        : "";
    return `  ${coloredBar}  ${progress}${rule}${chalk.dim(
      ` · ${elapsed()}`
    )}${findings}`;
  }

  function refreshStatus(): void {
    updater(renderStatus());
  }

  function writeFindingPermanent(finding: Finding): void {
    updater.clear();
    if (finding.file !== lastFile) {
      const rel =
        path.relative(options.projectRoot, finding.file) || finding.file;
      out.write(`\n  ${blueDiamond} ${chalk.bold(rel)}\n`);
      lastFile = finding.file;
    }
    out.write(formatFindingBody(finding) + "\n");
    refreshStatus();
  }

  function handleEvent(event: ScannerEvent): void {
    switch (event.type) {
      case "scan:start": {
        scanStartedAt = event.startedAt;
        rulesTotal = event.totalRules;
        const concernBits = event.concerns
          .map((c) => chalk.dim(c))
          .join(chalk.dim(" · "));
        out.write(
          `\n  ${xmcpLogo}  ${chalk.bold("Audit")}  ${chalk.dim("·")} ${concernBits}\n`
        );
        refreshStatus();
        return;
      }
      case "rule:start": {
        currentRule = event.ruleId;
        refreshStatus();
        return;
      }
      case "rule:complete": {
        rulesDone = event.index + 1;
        refreshStatus();
        return;
      }
      case "finding": {
        totalFindings += 1;
        writeFindingPermanent(event.finding);
        return;
      }
      case "deps:start": {
        depsPhase = "running";
        depsPm = event.packageManager;
        refreshStatus();
        return;
      }
      case "deps:complete": {
        depsPhase = "done";
        refreshStatus();
        return;
      }
      case "deps:skipped": {
        depsPhase = "skipped";
        // Silent — mentioned in the final summary if relevant.
        return;
      }
      case "scan:complete": {
        // Status stays pinned until finish() is called with the final report.
        return;
      }
    }
  }

  function finish(report: AuditReport): void {
    updater.clear();
    out.write("\n" + renderFinalSummary(report) + "\n");
  }

  return { handleEvent, finish };
}

function formatFindingBody(finding: Finding): string {
  const badge = SEVERITY_BADGE[finding.severity](finding.severity);
  const location =
    finding.line !== undefined ? `:${finding.line}:${finding.column ?? 1}` : "";
  const lines = [
    `     ${badge}  ${finding.message}`,
    `       ${chalk.dim(`${finding.ruleId}${location}`)}`,
  ];
  if (finding.suggestion) {
    lines.push(chalk.dim(`       ${yellowArrow} ${finding.suggestion}`));
  }
  return lines.join("\n");
}

function renderFinalSummary(report: AuditReport): string {
  const duration = formatDuration(report.durationMs);
  const hidden = summarizeHidden(report);

  if (report.findings.length === 0) {
    const tail = hidden ? chalk.dim(` · ${hidden}`) : "";
    return `  ${greenCheck} ${chalk.bold("No findings.")} ${chalk.dim(duration)}${tail}`;
  }

  const counts: Record<Severity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };
  for (const f of report.findings) counts[f.severity] += 1;

  const severityBits = (Object.keys(counts) as Severity[])
    .filter((sev) => counts[sev] > 0)
    .map((sev) => SEVERITY_BADGE[sev](`${counts[sev]} ${sev}`))
    .join(chalk.dim(" · "));

  const total = `${report.findings.length} finding${report.findings.length === 1 ? "" : "s"}`;
  const head = `  ${redCross} ${chalk.bold(total)}  ${severityBits}`;
  const tailBits = [hidden, duration].filter(Boolean).join(chalk.dim(" · "));
  return `${head}\n    ${chalk.dim(tailBits)}`;
}

function summarizeHidden(report: AuditReport): string {
  const bits: string[] = [];
  if (report.suppressed > 0) bits.push(`${report.suppressed} suppressed`);
  if (report.baselined > 0) bits.push(`${report.baselined} baselined`);
  return bits.join(", ");
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
