import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import { findHandlerFunction, walk } from "../../ast/visit";

const ID = "XMCP-PERF-005";

const rule: Rule = {
  meta: {
    id: ID,
    name: "json-stringify-in-text-content",
    description:
      "Large machine-readable payloads should use structuredContent instead of JSON.stringify text",
    severity: "low",
    concern: "performance",
    rationale:
      "Dumping object payloads into text content wastes context and weakens " +
      "tool/result usability for clients that can consume structuredContent directly.",
    heuristic: true,
    examples: {
      bad: "return { content: [{ type: 'text', text: JSON.stringify(data) }] };",
      good: "return { content: [{ type: 'text', text: 'Loaded config' }], structuredContent: data };",
    },
  },
  check(ctx): Finding[] {
    const findings: Finding[] = [];
    for (const file of ctx.tools) {
      const handler = findHandlerFunction(file.sourceFile);
      if (!handler) continue;

      const expressions = getReturnedObjectLiterals(handler);
      for (const expr of expressions) {
        if (!containsStringifiedTextContent(expr)) continue;
        if (hasStructuredContent(expr)) continue;

        const { line, column } = getLineColumn(
          file.sourceFile,
          expr.getStart(file.sourceFile)
        );
        findings.push({
          ruleId: ID,
          severity: "low",
          concern: "performance",
          message:
            "Tool serializes object data into text content with JSON.stringify instead of using structuredContent",
          file: file.absolutePath,
          line,
          column,
          suggestion:
            "Return the payload via `structuredContent` and keep text content concise",
        });
        break;
      }
    }
    return findings;
  },
};

function getReturnedObjectLiterals(
  fn: ts.FunctionLikeDeclaration
): ts.ObjectLiteralExpression[] {
  const results: ts.ObjectLiteralExpression[] = [];
  if (!fn.body) return results;
  if (!ts.isBlock(fn.body)) {
    if (ts.isObjectLiteralExpression(fn.body)) results.push(fn.body);
    return results;
  }

  walk(fn.body, (node) => {
    if (
      ts.isReturnStatement(node) &&
      node.expression &&
      ts.isObjectLiteralExpression(node.expression)
    ) {
      results.push(node.expression);
    }
  });
  return results;
}

function hasStructuredContent(expr: ts.ObjectLiteralExpression): boolean {
  return expr.properties.some(
    (prop) =>
      ts.isPropertyAssignment(prop) &&
      (ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name)) &&
      prop.name.text === "structuredContent"
  );
}

function containsStringifiedTextContent(
  expr: ts.ObjectLiteralExpression
): boolean {
  let found = false;
  walk(expr, (node) => {
    if (found || !ts.isCallExpression(node)) return;
    if (!ts.isPropertyAccessExpression(node.expression)) return;
    if (!ts.isIdentifier(node.expression.expression)) return;
    if (
      node.expression.expression.text === "JSON" &&
      node.expression.name.text === "stringify"
    ) {
      found = true;
    }
  });
  return found;
}

export default rule;
