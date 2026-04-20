import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import {
  findNamedExport,
  findObjectProperty,
  getStringLiteralValue,
} from "../../ast/visit";

const ID = "XMCP-META-004";

const MIN_LENGTH = 10;

const rule: Rule = {
  meta: {
    id: ID,
    name: "missing-tool-description",
    description: "Tool metadata.description must be a meaningful string",
    severity: "low",
    concern: "quality",
    rationale:
      "A missing or stub description degrades LLM tool selection. The " +
      "description is the primary signal the model uses when choosing " +
      "between tools.",
    examples: {
      bad: 'export const metadata = { name: "greet", description: "" };',
      good:
        "export const metadata = {\n" +
        '  name: "greet",\n' +
        '  description: "Greet a named user with a friendly message",\n' +
        "};",
    },
  },
  check(ctx): Finding[] {
    const findings: Finding[] = [];
    for (const file of ctx.tools) {
      const meta = findNamedExport(file.sourceFile, "metadata");
      if (!meta || !ts.isObjectLiteralExpression(meta)) continue;
      const descProp = findObjectProperty(meta, "description");
      const description = descProp
        ? getStringLiteralValue(descProp.initializer)
        : null;
      if (description !== null && description.trim().length >= MIN_LENGTH) {
        continue;
      }
      const target = descProp ?? meta;
      const { line, column } = getLineColumn(
        file.sourceFile,
        target.getStart(file.sourceFile)
      );
      findings.push({
        ruleId: ID,
        severity: "low",
        concern: "quality",
        message:
          description === null
            ? "Tool metadata is missing description"
            : `Tool description is too short (<${MIN_LENGTH} chars)`,
        file: file.absolutePath,
        line,
        column,
        suggestion: "Write a one-sentence description of what the tool does",
      });
    }
    return findings;
  },
};

export default rule;
