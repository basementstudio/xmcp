import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";
import rules from "./_audit-rules.json";

export const schema = {
  ruleId: z
    .string()
    .max(40)
    .describe("Rule ID like XMCP-PERF-002. Case-insensitive."),
};

export const metadata: ToolMetadata = {
  name: "explain_audit_rule",
  description:
    "Explain a single `xmcp audit` rule: severity, concern, rationale, and bad/good code examples.",
  annotations: {
    title: "Explain an xmcp audit rule",
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
};

export default async function explainAuditRule({
  ruleId,
}: InferSchema<typeof schema>) {
  const target = ruleId.trim().toUpperCase();
  const rule = rules.find((r) => r.id === target);
  if (!rule) {
    return `Unknown rule: ${ruleId}. Use \`list_audit_rules\` to see available IDs.`;
  }

  const heuristicNote = rule.heuristic
    ? "\n*Heuristic rule — may produce false positives.*"
    : "";

  return `# ${rule.id} — ${rule.name}

**Severity:** ${rule.severity}  •  **Concern:** ${rule.concern}${heuristicNote}

${rule.description}

## Why
${rule.rationale}

## Bad
\`\`\`ts
${rule.examples.bad}
\`\`\`

## Good
\`\`\`ts
${rule.examples.good}
\`\`\`
`;
}
