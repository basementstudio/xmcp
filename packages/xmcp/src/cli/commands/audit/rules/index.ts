import type { Rule } from "../types";

// Security
import handler001 from "./security/handler-001-child-process";
import handler002 from "./security/handler-002-eval";
import handler003 from "./security/handler-003-fs-path";
import handler004 from "./security/handler-004-fetch-ssrf";
import handler005 from "./security/handler-005-sql-concat";
import mcp001 from "./security/mcp-001-missing-auth-check";
import mcp002 from "./security/mcp-002-resource-traversal";
import mcp003 from "./security/mcp-003-prompt-injection-handler";
import mcp005 from "./security/mcp-005-stdio-shell-chars";
import meta002 from "./security/meta-002-prompt-injection";
import meta003 from "./security/meta-003-unicode-evasion";
import config001 from "./security/config-001-cors-credentials";
import config002 from "./security/config-002-http-no-auth";
import config003 from "./security/config-003-no-rate-limit";
import config004 from "./security/config-004-public-bind";
import secret001 from "./security/secret-001-hardcoded";
import secret002 from "./security/secret-002-env-leak";
import supply001 from "./security/supply-001-install-scripts";

// Compliance
import comply001 from "./compliance/comply-001-identifier-shape";
import comply002 from "./compliance/comply-002-resource-mime";
import comply003 from "./compliance/comply-003-prompt-arguments";
import comply004 from "./compliance/comply-004-description-length";
import comply005 from "./compliance/comply-005-package-manifest";

// Quality
import schema001 from "./quality/schema-001-no-any";
import schema002 from "./quality/schema-002-describe";
import schema003 from "./quality/schema-003-missing-schema";
import schema004 from "./quality/schema-004-unbounded-string";
import metaDestructive from "./quality/meta-001-destructive-hint";
import metaMissingDesc from "./quality/meta-004-missing-description";
import mcp004 from "./quality/mcp-004-tool-name-collision";

// Performance
import perf001 from "./performance/perf-001-sync-io";
import perf002 from "./performance/perf-002-oversized-description";
import perf003 from "./performance/perf-003-tool-sprawl";
import perf004 from "./performance/perf-004-duplicate-descriptions";

export const ALL_RULES: Rule[] = [
  // Security — 18 static
  secret001,
  secret002,
  supply001,
  meta002,
  meta003,
  handler001,
  handler002,
  handler003,
  handler004,
  handler005,
  mcp001,
  mcp002,
  mcp003,
  mcp005,
  config001,
  config002,
  config003,
  config004,
  // Compliance — 5
  comply001,
  comply002,
  comply003,
  comply004,
  comply005,
  // Quality — 7
  schema001,
  schema002,
  schema003,
  schema004,
  metaDestructive,
  metaMissingDesc,
  mcp004,
  // Performance — 4
  perf001,
  perf002,
  perf003,
  perf004,
];

export function getRule(id: string): Rule | undefined {
  return ALL_RULES.find((r) => r.meta.id === id);
}
