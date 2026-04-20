import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import {
  collectHandlerParamBindings,
  findHandlerFunction,
  referencesBinding,
  walk,
} from "../../ast/visit";

const ID = "XMCP-HANDLER-005";

const SQL_VERB = /\b(?:SELECT|INSERT|UPDATE|DELETE|DROP|UNION|WHERE|FROM)\b/i;

const rule: Rule = {
  meta: {
    id: ID,
    name: "sql-string-concat-with-user-input",
    description:
      "Tool handlers must not build SQL queries by concatenating handler input",
    severity: "high",
    concern: "security",
    rationale:
      "String-concatenated SQL is the textbook injection vector. Use " +
      "parameterized queries / prepared statements even when the field " +
      "seems constrained.",
    examples: {
      bad: "db.query(`SELECT * FROM users WHERE id = ${userId}`)",
      good: 'db.query("SELECT * FROM users WHERE id = $1", [userId])',
    },
    heuristic: true,
  },
  check(ctx): Finding[] {
    const findings: Finding[] = [];
    for (const file of ctx.tools) {
      const handler = findHandlerFunction(file.sourceFile);
      if (!handler) continue;
      const bindings = collectHandlerParamBindings(handler);
      if (bindings.size === 0) continue;

      walk(handler, (node) => {
        if (!ts.isTemplateExpression(node)) return;
        const head = node.head.text;
        const tailText = node.templateSpans
          .map((s) => s.literal.text)
          .join(" ");
        const full = head + " " + tailText;
        if (!SQL_VERB.test(full)) return;
        if (
          !node.templateSpans.some((s) =>
            referencesBinding(s.expression, bindings)
          )
        ) {
          return;
        }
        const { line, column } = getLineColumn(
          file.sourceFile,
          node.getStart(file.sourceFile)
        );
        findings.push({
          ruleId: ID,
          severity: "high",
          concern: "security",
          message:
            "SQL template literal interpolates handler input — use parameterized queries",
          file: file.absolutePath,
          line,
          column,
          suggestion: "Switch to parameterized queries ($1, ?, etc.)",
        });
      });
    }
    return findings;
  },
};

export default rule;
