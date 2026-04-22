import type { Rule } from "../types";

// Security
import handler001 from "./security/handler-001-child-process";
import handler002 from "./security/handler-002-eval";
import handler003 from "./security/handler-003-fs-path";
import handler004 from "./security/handler-004-fetch-ssrf";
import handler005 from "./security/handler-005-sql-concat";
import handler006 from "./security/handler-006-spawn-shell-option";
import handler007 from "./security/handler-007-token-passthrough";
import handler008 from "./security/handler-008-handler-returns-env";
import mcp001 from "./security/mcp-001-missing-auth-check";
import mcp002 from "./security/mcp-002-resource-traversal";
import mcp003 from "./security/mcp-003-prompt-injection-handler";
import mcp005 from "./security/mcp-005-stdio-shell-chars";
import mcp006 from "./security/mcp-006-stdout-write-in-stdio";
import mcp008 from "./security/mcp-008-dynamic-tool-metadata";
import mcp009 from "./security/mcp-009-tool-metadata-mutated";
import mcp011 from "./security/mcp-011-resource-uri";
import mcp013 from "./security/mcp-013-elicit-sensitive-form";
import mcp014 from "./security/mcp-014-elicit-unsafe-url";
import meta002 from "./security/meta-002-prompt-injection";
import meta003 from "./security/meta-003-unicode-evasion";
import config001 from "./security/config-001-cors-credentials";
import config002 from "./security/config-002-http-no-auth";
import config003 from "./security/config-003-no-rate-limit";
import config004 from "./security/config-004-public-bind";
import secret001 from "./security/secret-001-hardcoded";
import secret002 from "./security/secret-002-env-leak";
import supply001 from "./security/supply-001-install-scripts";
import handler009 from "./security/handler-009-raw-error-leak";

// Compliance
import comply001 from "./compliance/comply-001-identifier-shape";
import comply002 from "./compliance/comply-002-resource-mime";
import comply003 from "./compliance/comply-003-prompt-arguments";
import comply004 from "./compliance/comply-004-description-length";
import comply005 from "./compliance/comply-005-package-manifest";
import config005 from "./compliance/config-005-server-info";
import mcp010 from "./compliance/mcp-010-elicit-unchecked";

// Quality
import schema001 from "./quality/schema-001-no-any";
import schema002 from "./quality/schema-002-describe";
import schema003 from "./quality/schema-003-missing-schema";
import schema004 from "./quality/schema-004-unbounded-string";
import schema005 from "./quality/schema-005-output-contract";
import schema006 from "./quality/schema-006-structured-without-output-schema";
import metaDestructive from "./quality/meta-001-destructive-hint";
import metaMissingDesc from "./quality/meta-004-missing-description";
import meta005 from "./quality/meta-005-readonly-mismatch";
import meta006 from "./quality/meta-006-openworld-mismatch";
import mcp004 from "./quality/mcp-004-tool-name-collision";
import mcp012 from "./quality/mcp-012-description-args";
import resource001 from "./quality/resource-001-param-schema-drift";

// Performance
import perf001 from "./performance/perf-001-sync-io";
import perf002 from "./performance/perf-002-oversized-description";
import perf003 from "./performance/perf-003-tool-sprawl";
import perf004 from "./performance/perf-004-duplicate-descriptions";
import perf005 from "./performance/perf-005-json-stringify-content";

export const ALL_RULES: Rule[] = [
  // Security — 24 static
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
  handler006,
  handler007,
  handler008,
  handler009,
  mcp001,
  mcp002,
  mcp003,
  mcp005,
  mcp006,
  mcp008,
  mcp009,
  mcp011,
  mcp013,
  mcp014,
  config001,
  config002,
  config003,
  config004,
  // Compliance — 7
  comply001,
  comply002,
  comply003,
  comply004,
  comply005,
  config005,
  mcp010,
  // Quality — 9
  schema001,
  schema002,
  schema003,
  schema004,
  schema005,
  schema006,
  metaDestructive,
  metaMissingDesc,
  meta005,
  meta006,
  mcp004,
  mcp012,
  resource001,
  // Performance — 4
  perf001,
  perf002,
  perf003,
  perf004,
  perf005,
];

export function getRule(id: string): Rule | undefined {
  return ALL_RULES.find((r) => r.meta.id === id);
}
