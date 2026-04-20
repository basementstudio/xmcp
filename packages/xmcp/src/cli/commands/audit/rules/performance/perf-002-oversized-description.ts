import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import {
  findNamedExport,
  findObjectProperty,
  getStringLiteralValue,
} from "../../ast/visit";

const ID = "XMCP-PERF-002";

const SOFT_LIMIT = 500;

const rule: Rule = {
  meta: {
    id: ID,
    name: "oversized-tool-description",
    description:
      "Tool descriptions over 500 characters waste the model context budget",
    severity: "low",
    concern: "performance",
    rationale:
      "Every byte of a tool description ships on every request. A 2KB " +
      "description across 20 tools is a 40KB tax on every prompt. Keep it " +
      "tight.",
    examples: {
      bad: 'description: "...long narrative description well past 500 chars..."',
      good: 'description: "Short, action-oriented tool summary"',
    },
  },
  check(ctx): Finding[] {
    const findings: Finding[] = [];
    for (const file of ctx.tools) {
      const meta = findNamedExport(file.sourceFile, "metadata");
      if (!meta || !ts.isObjectLiteralExpression(meta)) continue;
      const descProp = findObjectProperty(meta, "description");
      if (!descProp) continue;
      const description = getStringLiteralValue(descProp.initializer);
      if (description === null) continue;
      if (description.length <= SOFT_LIMIT) continue;
      const { line, column } = getLineColumn(
        file.sourceFile,
        descProp.getStart(file.sourceFile)
      );
      findings.push({
        ruleId: ID,
        severity: "low",
        concern: "performance",
        message: `Tool description is ${description.length} chars (soft limit ${SOFT_LIMIT})`,
        file: file.absolutePath,
        line,
        column,
        suggestion: "Shorten the description; push detail into documentation",
      });
    }
    return findings;
  },
};

export default rule;
