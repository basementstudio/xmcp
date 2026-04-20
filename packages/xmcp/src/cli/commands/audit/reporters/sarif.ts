import path from "node:path";
import { pathToFileURL } from "node:url";
import type { AuditReport, Concern, Finding, Severity } from "../types";
import { ALL_RULES } from "../rules";

type SarifLevel = "error" | "warning" | "note" | "none";

const LEVEL_BY_SEVERITY: Record<Severity, SarifLevel> = {
  critical: "error",
  high: "error",
  medium: "warning",
  low: "note",
  info: "note",
};

const SEVERITY_RANK: Record<Severity, number> = {
  critical: 9.8,
  high: 8.5,
  medium: 5.5,
  low: 3.0,
  info: 1.0,
};

export interface SarifRenderOptions {
  toolVersion: string;
  pretty?: boolean;
}

export function renderSarif(
  report: AuditReport,
  options: SarifRenderOptions
): string {
  const referencedRuleIds = new Set(report.findings.map((f) => f.ruleId));
  const rules: SarifRule[] = ALL_RULES.filter((r) =>
    referencedRuleIds.has(r.meta.id)
  ).map((r): SarifRule => {
    const level: SarifLevel =
      r.meta.severity === "dynamic"
        ? "warning"
        : LEVEL_BY_SEVERITY[r.meta.severity];
    const properties: SarifRule["properties"] = {
      concern: r.meta.concern,
      tags: [r.meta.concern, ...(r.meta.heuristic ? ["heuristic"] : [])],
    };
    if (r.meta.severity !== "dynamic") {
      properties["security-severity"] = String(SEVERITY_RANK[r.meta.severity]);
    }
    return {
      id: r.meta.id,
      name: r.meta.name,
      shortDescription: { text: r.meta.description },
      fullDescription: { text: r.meta.rationale },
      defaultConfiguration: { level },
      properties,
      help: {
        text: r.meta.rationale,
        markdown: buildHelpMarkdown(r.meta.rationale, r.meta.examples),
      },
    };
  });

  // DEPS-001 findings reference a rule we include dynamically.
  if (referencedRuleIds.has("XMCP-DEPS-001")) {
    const depsRule = ALL_RULES.find((r) => r.meta.id === "XMCP-DEPS-001");
    if (!depsRule) {
      rules.push(buildDepsRulePlaceholder());
    }
  }

  const results = [...report.findings]
    .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])
    .map((f): SarifResult => buildResult(f, report.projectRoot));

  const sarif = {
    $schema:
      "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "xmcp-audit",
            version: options.toolVersion,
            informationUri: "https://xmcp.dev",
            rules,
          },
        },
        invocations: [
          {
            executionSuccessful: true,
            workingDirectory: {
              uri: pathToFileURL(report.projectRoot).toString(),
            },
          },
        ],
        results,
      },
    ],
  };

  return options.pretty === false
    ? JSON.stringify(sarif)
    : JSON.stringify(sarif, null, 2) + "\n";
}

interface SarifResult {
  ruleId: string;
  level: SarifLevel;
  message: { text: string };
  locations: Array<{
    physicalLocation: {
      artifactLocation: { uri: string };
      region?: { startLine: number; startColumn?: number };
    };
  }>;
  properties?: Record<string, unknown>;
  fixes?: Array<{ description: { text: string } }>;
}

function buildResult(f: Finding, projectRoot: string): SarifResult {
  const uri = toSarifUri(projectRoot, f.file);
  const region =
    f.line !== undefined
      ? {
          startLine: f.line,
          ...(f.column !== undefined && { startColumn: f.column }),
        }
      : undefined;
  const result: SarifResult = {
    ruleId: f.ruleId,
    level: LEVEL_BY_SEVERITY[f.severity],
    message: { text: f.message },
    locations: [
      {
        physicalLocation: {
          artifactLocation: { uri },
          ...(region && { region }),
        },
      },
    ],
    properties: {
      concern: f.concern,
      severity: f.severity,
      ...(f.metadata && { metadata: f.metadata }),
    },
  };
  if (f.suggestion) {
    result.fixes = [{ description: { text: f.suggestion } }];
  }
  return result;
}

function toSarifUri(projectRoot: string, file: string): string {
  if (file.startsWith(projectRoot)) {
    const rel = path.relative(projectRoot, file);
    return rel.split(path.sep).join("/");
  }
  return file;
}

function buildHelpMarkdown(
  rationale: string,
  examples: { good: string; bad: string }
): string {
  return [
    rationale,
    "",
    "**Bad**",
    "```ts",
    examples.bad,
    "```",
    "",
    "**Good**",
    "```ts",
    examples.good,
    "```",
  ].join("\n");
}

function buildDepsRulePlaceholder(): SarifRule {
  return {
    id: "XMCP-DEPS-001",
    name: "dependency-vulnerability",
    shortDescription: {
      text: "Known vulnerability in a project dependency",
    },
    fullDescription: {
      text: "Reported via npm/pnpm/yarn audit",
    },
    defaultConfiguration: { level: "warning" },
    properties: {
      concern: "security",
      tags: ["security", "dependencies"],
    },
    help: { text: "See npm audit documentation", markdown: "" },
  };
}

interface SarifRule {
  id: string;
  name: string;
  shortDescription: { text: string };
  fullDescription: { text: string };
  defaultConfiguration: { level: SarifLevel };
  properties: {
    concern: Concern;
    tags: string[];
    "security-severity"?: string;
  };
  help: { text: string; markdown: string };
}
