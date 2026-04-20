import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import { findHandlerFunction, getCalleeName, walk } from "../../ast/visit";

const ID = "XMCP-HANDLER-002";

const rule: Rule = {
  meta: {
    id: ID,
    name: "eval-in-handler",
    description: "Tool handlers must not use eval() or new Function(...)",
    severity: "critical",
    concern: "security",
    rationale:
      "Dynamic code execution inside a tool handler lets any caller run " +
      "arbitrary JS in the server process. There is never a safe reason to " +
      "ship this.",
    examples: {
      bad: "export default async ({ code }) => eval(code);",
      good:
        "// use a purpose-built sandbox (vm2, isolated-vm) with a strict " +
        "allowlist, or don't accept code from callers",
    },
  },
  check(ctx): Finding[] {
    const findings: Finding[] = [];
    for (const file of ctx.tools) {
      const handler = findHandlerFunction(file.sourceFile);
      if (!handler) continue;
      walk(handler, (node) => {
        let name: string | null = null;
        if (ts.isCallExpression(node)) name = getCalleeName(node);
        if (ts.isNewExpression(node)) {
          const expr = node.expression;
          if (ts.isIdentifier(expr)) name = expr.text;
        }
        if (name !== "eval" && name !== "Function") return;
        const { line, column } = getLineColumn(
          file.sourceFile,
          node.getStart(file.sourceFile)
        );
        findings.push({
          ruleId: ID,
          severity: "critical",
          concern: "security",
          message: `${name}() in tool handler allows arbitrary code execution`,
          file: file.absolutePath,
          line,
          column,
          suggestion: "Remove dynamic evaluation or move it behind a sandbox",
        });
      });
    }
    return findings;
  },
};

export default rule;
