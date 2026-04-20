import path from "node:path";
import { matchesGlob } from "./config";
import type { AuditConfig, Finding, SuppressionDirective } from "./types";

const SAME_LINE = /\/\/\s*xmcp-audit-ignore\s+([A-Z0-9*-]+)(?:\s+(.*))?/;
const NEXT_LINE =
  /\/\/\s*xmcp-audit-ignore-next-line\s+([A-Z0-9*-]+)(?:\s+(.*))?/;

export function parseSuppressions(source: string): SuppressionDirective[] {
  const directives: SuppressionDirective[] = [];
  const lines = source.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLineMatch = line.match(NEXT_LINE);
    if (nextLineMatch) {
      directives.push({
        ruleId: nextLineMatch[1],
        line: i + 2, // next line, 1-indexed
        reason: nextLineMatch[2]?.trim(),
      });
      continue;
    }
    const sameLineMatch = line.match(SAME_LINE);
    if (sameLineMatch) {
      directives.push({
        ruleId: sameLineMatch[1],
        line: i + 1, // current line, 1-indexed
        reason: sameLineMatch[2]?.trim(),
      });
    }
  }

  return directives;
}

export function isSuppressed(
  finding: Finding,
  suppressions: Map<string, SuppressionDirective[]>
): boolean {
  if (finding.line === undefined) return false;
  const directives = suppressions.get(finding.file);
  if (!directives) return false;

  return directives.some(
    (d) =>
      d.line === finding.line &&
      (d.ruleId === "*" || d.ruleId === finding.ruleId)
  );
}

export function isIgnoredByConfig(
  finding: Finding,
  projectRoot: string,
  auditConfig: AuditConfig
): boolean {
  if (auditConfig.ignore.length === 0) return false;
  const relative = toPosix(path.relative(projectRoot, finding.file));
  for (const entry of auditConfig.ignore) {
    if (typeof entry === "string") {
      if (matchesGlob(entry, relative)) return true;
      continue;
    }
    if (entry.rule !== finding.ruleId) continue;
    if (entry.paths.some((p) => matchesGlob(p, relative))) return true;
  }
  return false;
}

function toPosix(p: string): string {
  return p.split(path.sep).join("/");
}
