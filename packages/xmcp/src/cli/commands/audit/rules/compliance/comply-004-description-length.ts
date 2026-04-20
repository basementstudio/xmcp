import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import {
  findNamedExport,
  findObjectProperty,
  getStringLiteralValue,
} from "../../ast/visit";

const ID = "XMCP-COMPLY-004";

const MAX_LENGTH = 1024;

const rule: Rule = {
  meta: {
    id: ID,
    name: "tool-description-too-long",
    description:
      "Tool descriptions longer than 1024 characters risk truncation by clients",
    severity: "low",
    concern: "compliance",
    rationale:
      "Some MCP clients truncate long descriptions; the model then sees a " +
      "cut-off contract. Keep descriptions under 1024 chars and push detail " +
      "into examples or documentation.",
    examples: {
      bad: 'description: "...very long text...", // > 1024 chars',
      good: 'description: "Brief and actionable summary of what this tool does",',
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
      if (description === null || description.length <= MAX_LENGTH) continue;
      const { line, column } = getLineColumn(
        file.sourceFile,
        descProp.getStart(file.sourceFile)
      );
      findings.push({
        ruleId: ID,
        severity: "low",
        concern: "compliance",
        message: `Tool description is ${description.length} chars (max ${MAX_LENGTH})`,
        file: file.absolutePath,
        line,
        column,
        suggestion: "Trim the description or move detail elsewhere",
      });
    }
    return findings;
  },
};

export default rule;
