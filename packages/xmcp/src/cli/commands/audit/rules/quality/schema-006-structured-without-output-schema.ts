import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import { findHandlerFunction, findNamedExport, walk } from "../../ast/visit";

const ID = "XMCP-SCHEMA-006";

const rule: Rule = {
  meta: {
    id: ID,
    name: "structured-output-missing-output-schema",
    description:
      "Tools that return machine-readable object data should export outputSchema",
    severity: "medium",
    concern: "quality",
    rationale:
      "Machine-readable tool output is more reliable when its shape is " +
      "explicit. Returning object payloads without outputSchema forces " +
      "clients and models to infer contracts from examples.",
    heuristic: true,
    examples: {
      bad: "export default async () => ({ userId: '123', plan: 'pro' });",
      good:
        "export const outputSchema = { userId: z.string(), plan: z.string() };\n" +
        "export default async () => ({ userId: '123', plan: 'pro' });",
    },
  },
  check(ctx): Finding[] {
    const findings: Finding[] = [];
    for (const file of ctx.tools) {
      if (findNamedExport(file.sourceFile, "outputSchema")) continue;
      const handler = findHandlerFunction(file.sourceFile);
      if (!handler) continue;

      let target: ts.Node | null = null;
      const expressions = getReturnedExpressions(handler);
      for (const expr of expressions) {
        if (isStructuredDataReturn(expr)) {
          target = expr;
          break;
        }
      }
      if (!target) continue;

      const { line, column } = getLineColumn(
        file.sourceFile,
        target.getStart(file.sourceFile)
      );
      findings.push({
        ruleId: ID,
        severity: "medium",
        concern: "quality",
        message:
          "Tool returns structured object data but does not export outputSchema",
        file: file.absolutePath,
        line,
        column,
        suggestion:
          "Add `export const outputSchema = { ... }` for the returned object shape",
      });
    }
    return findings;
  },
};

function getReturnedExpressions(
  fn: ts.FunctionLikeDeclaration
): ts.Expression[] {
  if (!fn.body) return [];
  if (!ts.isBlock(fn.body)) return [fn.body];

  const expressions: ts.Expression[] = [];
  walk(fn.body, (node) => {
    if (ts.isReturnStatement(node) && node.expression) {
      expressions.push(node.expression);
    }
  });
  return expressions;
}

function isStructuredDataReturn(expr: ts.Expression): boolean {
  if (!ts.isObjectLiteralExpression(expr)) return false;
  const entries = new Map<string, ts.Expression>();
  for (const prop of expr.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const key =
      ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name)
        ? prop.name.text
        : null;
    if (key) entries.set(key, prop.initializer);
  }

  if (
    entries.has("isError") &&
    entries.get("isError")?.kind === ts.SyntaxKind.TrueKeyword
  ) {
    return false;
  }
  if (entries.has("content")) {
    return entries.has("structuredContent");
  }
  if (entries.has("_meta")) return false;
  return true;
}

export default rule;
