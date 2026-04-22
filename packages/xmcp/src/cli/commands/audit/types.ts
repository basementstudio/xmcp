import type ts from "typescript";

export type Severity = "info" | "low" | "medium" | "high" | "critical";

export type Concern = "security" | "compliance" | "quality" | "performance";

export const SEVERITY_ORDER: Record<Severity, number> = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export const ALL_CONCERNS: readonly Concern[] = [
  "security",
  "compliance",
  "quality",
  "performance",
] as const;

export interface RuleExample {
  bad: string;
  good: string;
}

export interface RuleMetadata {
  id: string;
  name: string;
  description: string;
  severity: Severity | "dynamic";
  concern: Concern;
  rationale: string;
  examples: RuleExample;
  heuristic?: boolean;
  /**
   * True for rules that reason about the whole project (manifest, config,
   * cross-file collisions). Incremental scans (`--since` / `--changed`) keep
   * these running regardless of which files changed.
   */
  projectScope?: boolean;
}

export interface Finding {
  ruleId: string;
  severity: Severity;
  concern: Concern;
  message: string;
  file: string;
  line?: number;
  column?: number;
  snippet?: string;
  suggestion?: string;
  metadata?: Record<string, unknown>;
}

export interface ParsedFile {
  absolutePath: string;
  source: string;
  sourceFile: ts.SourceFile;
}

export interface SuppressionDirective {
  ruleId: string;
  line: number;
  reason?: string;
}

export type AuditSeverityOverride = Severity | "off";

export interface AuditIgnoreRuleScoped {
  rule: string;
  paths: string[];
}

export type AuditIgnoreEntry = string | AuditIgnoreRuleScoped;

export interface AuditConfig {
  ignore: AuditIgnoreEntry[];
  severity: Record<string, AuditSeverityOverride>;
  failOn: Severity | null;
}

export interface ScanContext {
  projectRoot: string;
  xmcpConfigPresent: boolean;
  xmcpConfigFile: ParsedFile | null;
  toolsDir: string | null;
  promptsDir: string | null;
  resourcesDir: string | null;
  tools: ParsedFile[];
  prompts: ParsedFile[];
  resources: ParsedFile[];
  allSourceFiles: ParsedFile[];
  packageJson: Record<string, unknown> | null;
  packageJsonPath: string | null;
  packageManager: "npm" | "pnpm" | "yarn" | null;
  gitignoreContent: string | null;
  suppressions: Map<string, SuppressionDirective[]>;
  auditConfig: AuditConfig;
  changedFiles: Set<string> | null;
  activeConcerns: Set<Concern>;
  noDeps: boolean;
  strictExecutionErrors: boolean;
}

export interface Rule {
  meta: RuleMetadata;
  check(ctx: ScanContext): Finding[];
}

export interface AuditRunOptions {
  path: string;
  concern?: string[];
  format?: "terminal" | "json" | "sarif";
  severity?: Severity;
  failOn?: Severity;
  disableRule?: string[];
  enableRule?: string[];
  noHeuristics?: boolean;
  noDeps?: boolean;
  output?: string;
  ci?: boolean;
  strictExecutionErrors?: boolean;
  baseline?: string;
  updateBaseline?: boolean;
  since?: string;
  changed?: boolean;
}

export interface AuditReport {
  projectRoot: string;
  activeConcerns: Concern[];
  findings: Finding[];
  suppressed: number;
  baselined: number;
  resolvedFailOn: Severity | null;
  durationMs: number;
}
