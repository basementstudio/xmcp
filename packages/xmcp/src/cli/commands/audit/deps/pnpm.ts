import type { DepsAdvisory } from "./index";
import type { Severity } from "../types";

// pnpm audit --json output shape:
// { advisories: { <id>: { module_name, title, url, severity, vulnerable_versions, findings, patched_versions } } }
interface PnpmAuditJson {
  advisories?: Record<
    string,
    {
      module_name?: string;
      title?: string;
      url?: string;
      severity?: string;
      vulnerable_versions?: string;
      patched_versions?: string;
      cves?: string[];
    }
  >;
}

export function mapPnpmOutput(stdout: string): DepsAdvisory[] {
  const parsed = safeJsonParse<PnpmAuditJson>(stdout);
  if (!parsed?.advisories) return [];

  return Object.values(parsed.advisories).map((a) => ({
    package: a.module_name ?? "unknown",
    severity: mapSeverity(a.severity ?? "info"),
    title: a.title ?? "Vulnerability",
    range: a.vulnerable_versions,
    url: a.url,
    cves: a.cves,
    fixAvailable: a.patched_versions,
  }));
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
