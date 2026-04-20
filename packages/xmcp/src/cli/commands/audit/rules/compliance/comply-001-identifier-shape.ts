import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import {
  findNamedExport,
  findObjectProperty,
  getStringLiteralValue,
} from "../../ast/visit";

const ID = "XMCP-COMPLY-001";

// Accept lowercase snake_case and kebab-case. Reject spaces, leading digits,
// uppercase, and other punctuation.
const RECOMMENDED = /^[a-z][a-z0-9_-]*$/;

const rule: Rule = {
  meta: {
    id: ID,
    name: "tool-identifier-shape",
    description:
      "Tool and prompt names should match the MCP identifier recommendation [a-z][a-z0-9_]*",
    severity: "low",
    concern: "compliance",
    rationale:
      "Clients vary in how they canonicalize names that contain spaces, " +
      "kebab-case, or leading digits. Staying inside the snake_case " +
      "recommendation avoids surprises at invoke time.",
    examples: {
      bad: 'export const metadata = { name: "Get User", description: "..." };',
      good: 'export const metadata = { name: "get_user", description: "..." };',
    },
  },
  check(ctx): Finding[] {
    const findings: Finding[] = [];
    for (const file of [...ctx.tools, ...ctx.prompts]) {
      const meta = findNamedExport(file.sourceFile, "metadata");
      if (!meta || !ts.isObjectLiteralExpression(meta)) continue;
      const nameProp = findObjectProperty(meta, "name");
      if (!nameProp) continue;
      const name = getStringLiteralValue(nameProp.initializer);
      if (!name || RECOMMENDED.test(name)) continue;
      const { line, column } = getLineColumn(
        file.sourceFile,
        nameProp.getStart(file.sourceFile)
      );
      findings.push({
        ruleId: ID,
        severity: "low",
        concern: "compliance",
        message: `Name "${name}" does not match [a-z][a-z0-9_-]*`,
        file: file.absolutePath,
        line,
        column,
        suggestion: "Rename to snake_case or kebab-case",
      });
    }
    return findings;
  },
};

export default rule;
