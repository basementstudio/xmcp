import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import { isZodCall, walk } from "../../ast/visit";

const ID = "XMCP-SCHEMA-001";

const rule: Rule = {
  meta: {
    id: ID,
    name: "no-zod-any-in-tool-schema",
    description: "Tool input schemas must not use z.any() or z.unknown()",
    severity: "medium",
    concern: "quality",
    rationale:
      "z.any() and z.unknown() disable input validation. LLM clients can " +
      "pass anything, and handlers cannot trust the shape of their arguments.",
    examples: {
      bad: "export const schema = { payload: z.any() };",
      good: "export const schema = { payload: z.object({ id: z.string() }) };",
    },
  },
  check(ctx): Finding[] {
    const findings: Finding[] = [];
    for (const file of ctx.tools) {
      walk(file.sourceFile, (node) => {
        const isAny = isZodCall(node, "any");
        const isUnknown = isZodCall(node, "unknown");
        if (!isAny && !isUnknown) return;
        const method = isAny ? "any" : "unknown";
        const { line, column } = getLineColumn(
          file.sourceFile,
          node.getStart(file.sourceFile)
        );
        findings.push({
          ruleId: ID,
          severity: "medium",
          concern: "quality",
          message: `z.${method}() in tool schema disables input validation`,
          file: file.absolutePath,
          line,
          column,
          suggestion: "Replace with a typed schema (z.object, z.string, etc.)",
        });
      });
    }
    return findings;
  },
};

export default rule;
