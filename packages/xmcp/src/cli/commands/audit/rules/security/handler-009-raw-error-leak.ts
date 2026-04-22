import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import { findHandlerFunction, walk } from "../../ast/visit";

const ID = "XMCP-HANDLER-009";

const rule: Rule = {
  meta: {
    id: ID,
    name: "raw-error-leak",
    description:
      "Tool handlers should not expose raw exception objects or stacks to model-visible output",
    severity: "medium",
    concern: "security",
    rationale:
      "Raw exceptions often contain stack traces, internal paths, tokens, " +
      "or upstream payloads. MCP tools should surface sanitized user-facing " +
      "errors instead of serializing exception internals into results.",
    heuristic: true,
    examples: {
      bad:
        "catch (error) {\n" +
        "  return { content: [{ type: 'text', text: JSON.stringify(error) }] };\n" +
        "}",
      good:
        "catch {\n" +
        "  return { isError: true, content: [{ type: 'text', text: 'Request failed' }] };\n" +
        "}",
    },
  },
  check(ctx): Finding[] {
    const findings: Finding[] = [];

    for (const file of ctx.tools) {
      const handler = findHandlerFunction(file.sourceFile);
      if (!handler || !handler.body || !ts.isBlock(handler.body)) continue;

      walk(handler.body, (node) => {
        if (!ts.isCatchClause(node) || !node.variableDeclaration) return;
        const name = node.variableDeclaration.name;
        if (!ts.isIdentifier(name) || !node.block) return;

        walk(node.block, (inner) => {
          if (!ts.isReturnStatement(inner) || !inner.expression) return;
          if (!returnLeaksRawError(inner.expression, name.text)) return;

          const { line, column } = getLineColumn(
            file.sourceFile,
            inner.expression.getStart(file.sourceFile)
          );
          findings.push({
            ruleId: ID,
            severity: "medium",
            concern: "security",
            message:
              "Catch block returns raw error details to the model-visible tool result",
            file: file.absolutePath,
            line,
            column,
            suggestion:
              "Return a sanitized error message, optionally with `isError: true`, instead of serializing the caught exception",
          });
        });
      });
    }

    return findings;
  },
};

function returnLeaksRawError(node: ts.Expression, errorName: string): boolean {
  let leaked = false;

  walk(node, (current) => {
    if (leaked) return;

    if (ts.isIdentifier(current) && current.text === errorName) {
      leaked = true;
      return;
    }

    if (
      ts.isPropertyAccessExpression(current) &&
      ts.isIdentifier(current.expression) &&
      current.expression.text === errorName &&
      current.name.text !== "message"
    ) {
      leaked = true;
      return;
    }

    if (
      ts.isCallExpression(current) &&
      ts.isPropertyAccessExpression(current.expression) &&
      ts.isIdentifier(current.expression.expression) &&
      current.expression.expression.text === "JSON" &&
      current.expression.name.text === "stringify" &&
      current.arguments.some(
        (arg) => ts.isIdentifier(arg) && arg.text === errorName
      )
    ) {
      leaked = true;
    }
  });

  return leaked;
}

export default rule;
