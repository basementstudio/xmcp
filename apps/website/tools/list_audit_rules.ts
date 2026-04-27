import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";
import rules from "./_audit-rules.json";

const CONCERNS = ["security", "compliance", "quality", "performance"] as const;

export const schema = {
  concern: z
    .enum(CONCERNS)
    .describe("Filter to one concern. Omit to list all concerns.")
    .optional(),
};

export const metadata: ToolMetadata = {
  name: "list_audit_rules",
  description:
    "List the rules enforced by `xmcp audit`, optionally filtered by concern. " +
    "Returns rule IDs grouped by concern with severity and a one-line description.",
  annotations: {
    title: "List xmcp audit rules",
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
};

type Concern = (typeof CONCERNS)[number];
type Rule = (typeof rules)[number];

export default async function listAuditRules({
  concern,
}: InferSchema<typeof schema>) {
  const filtered = concern ? rules.filter((r) => r.concern === concern) : rules;

  const grouped = new Map<Concern, Rule[]>();
  for (const r of filtered) {
    const key = r.concern as Concern;
    const bucket = grouped.get(key) ?? [];
    bucket.push(r);
    grouped.set(key, bucket);
  }

  const sections: string[] = [];
  for (const c of CONCERNS) {
    const bucket = grouped.get(c);
    if (!bucket || bucket.length === 0) continue;
    const lines = bucket.map(
      (r) =>
        `- **${r.id}** (${r.severity}) — ${r.name}: ${r.description}${r.heuristic ? " *(heuristic)*" : ""}`
    );
    sections.push(`## ${c}\n\n${lines.join("\n")}`);
  }

  return `${filtered.length} rules${concern ? ` for concern \`${concern}\`` : ""}.\n\n${sections.join("\n\n")}`;
}
