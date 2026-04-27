import fs from "node:fs";
import path from "node:path";

import { ALL_RULES } from "../../../packages/xmcp/src/cli/commands/audit/rules";

const out = ALL_RULES.map((r) => ({
  id: r.meta.id,
  name: r.meta.name,
  description: r.meta.description,
  severity: r.meta.severity,
  concern: r.meta.concern,
  rationale: r.meta.rationale,
  heuristic: r.meta.heuristic === true,
  examples: r.meta.examples,
}));

const target = path.join(__dirname, "..", "tools", "_audit-rules.json");
fs.writeFileSync(target, JSON.stringify(out, null, 2) + "\n");
process.stdout.write(
  `Wrote ${out.length} rules to ${path.relative(process.cwd(), target)}\n`
);
