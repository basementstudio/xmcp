import type { DepsAdvisory } from "./index";
import type { Severity } from "../types";

// npm audit --json output shape (v7+):
// { vulnerabilities: { <pkg>: { severity, via: [{ source, title, url, range, cwe }], range, fixAvailable } } }
interface NpmAuditJson {
  vulnerabilities?: Record<
    string,
    {
      severity: string;
      via?: Array<
        | string
        | {
            source?: number;
            title?: string;
            url?: string;
            range?: string;
            cwe?: string[];
          }
      >;
      range?: string;
      fixAvailable?: boolean | { name: string; version: string };
    }
  >;
}

export function mapNpmOutput(stdout: string): DepsAdvisory[] {
  const parsed = safeJsonParse<NpmAuditJson>(stdout);
  if (!parsed?.vulnerabilities) return [];

  const advisories: DepsAdvisory[] = [];
  for (const [pkg, entry] of Object.entries(parsed.vulnerabilities)) {
    const via = (entry.via ?? []).filter(
      (v): v is Extract<typeof v, { title?: string }> => typeof v !== "string"
    );
    if (via.length === 0) continue;
    for (const advisory of via) {
      advisories.push({
        package: pkg,
        severity: mapSeverity(entry.severity),
        title: advisory.title ?? "Vulnerability",
        range: advisory.range ?? entry.range,
        url: advisory.url,
        cves: advisory.cwe,
        fixAvailable:
          typeof entry.fixAvailable === "object"
            ? `${entry.fixAvailable.name}@${entry.fixAvailable.version}`
            : entry.fixAvailable,
      });
    }
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
