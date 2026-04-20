import type { DepsAdvisory } from "./index";
import type { Severity } from "../types";

// yarn npm audit --json emits one JSON document per line. Each line is either:
// { type: "auditAdvisory", data: { advisory: { module_name, title, url, severity, cves, patched_versions, vulnerable_versions } } }
// or { type: "auditSummary", data: {...} }.
interface YarnAuditLine {
  type?: string;
  data?: {
    advisory?: {
      module_name?: string;
      title?: string;
      url?: string;
      severity?: string;
      cves?: string[];
      patched_versions?: string;
      vulnerable_versions?: string;
    };
  };
}

export function mapYarnOutput(stdout: string): DepsAdvisory[] {
  const advisories: DepsAdvisory[] = [];
  for (const rawLine of stdout.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const parsed = safeJsonParse<YarnAuditLine>(line);
    if (parsed?.type !== "auditAdvisory") continue;
    const a = parsed.data?.advisory;
    if (!a) continue;
    advisories.push({
      package: a.module_name ?? "unknown",
      severity: mapSeverity(a.severity ?? "info"),
      title: a.title ?? "Vulnerability",
      range: a.vulnerable_versions,
      url: a.url,
      cves: a.cves,
      fixAvailable: a.patched_versions,
    });
  }
  return advisories;
}

function mapSeverity(raw: string): Severity {
  switch (raw) {
    case "critical":
      return "critical";
    case "high":
      return "high";
    case "moderate":
      return "medium";
    case "low":
      return "low";
    default:
      return "info";
  }
}

function safeJsonParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
