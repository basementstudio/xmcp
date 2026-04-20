import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import { findHandlerFunction, walk } from "../../ast/visit";

const ID = "XMCP-HANDLER-008";

const rule: Rule = {
  meta: {
    id: ID,
    name: "handler-returns-env",
    description:
      "Tool handlers must not return process.env (or values derived from it) to the caller",
    severity: "critical",
    concern: "security",
    rationale:
      "Returning the environment object — or a whole-object derivative like " +
      "JSON.stringify(process.env) or { ...process.env } — hands every " +
      "secret the server holds to the caller in one shot. This is the " +
      "canonical OWASP MCP01:2025 example.",
    examples: {
      bad:
        "export default async () => ({\n" +
        "  content: [{ type: 'text', text: JSON.stringify(process.env) }],\n" +
        "});",
      good:
        "export default async () => ({\n" +
        "  content: [{ type: 'text', text: process.env.PUBLIC_BUILD_ID ?? 'dev' }],\n" +
        "});",
    },
    heuristic: true,
  },
  check(ctx): Finding[] {
    const findings: Finding[] = [];
    for (const file of ctx.tools) {
      const handler = findHandlerFunction(file.sourceFile);
      if (!handler) continue;

      const tainted = collectEnvTaintedLocals(handler);
      const returnExprs = collectReturnExpressions(handler);

      for (const expr of returnExprs) {
        const reason = findLeakReason(expr, tainted);
        if (!reason) continue;
        const { line, column } = getLineColumn(
          file.sourceFile,
          expr.getStart(file.sourceFile)
        );
        findings.push({
          ruleId: ID,
          severity: "critical",
          concern: "security",
          message: `Tool handler return expression ${reason} — credential leakage`,
          file: file.absolutePath,
          line,
          column,
          suggestion:
            "Return only the specific values the tool is meant to expose. Never return process.env as a whole or pass it to JSON.stringify / Object.entries / spread.",
        });
      }
    }
    return findings;
  },
};

function collectReturnExpressions(
  fn: ts.FunctionLikeDeclaration
): ts.Expression[] {
  // Arrow function with a concise expression body: the body IS the return.
  if (ts.isArrowFunction(fn) && fn.body && !ts.isBlock(fn.body)) {
    return [fn.body];
  }
  const exprs: ts.Expression[] = [];
  if (fn.body && ts.isBlock(fn.body)) {
    walk(fn.body, (node) => {
      if (ts.isReturnStatement(node) && node.expression) {
        exprs.push(node.expression);
      }
    });
  }
  return exprs;
}

// Locals whose initializer captured the whole env object (or an enumeration of
// it). Tracking these lets us catch `const all = process.env; return all;`.
function collectEnvTaintedLocals(fn: ts.FunctionLikeDeclaration): Set<string> {
  const tainted = new Set<string>();
  if (!fn.body || !ts.isBlock(fn.body)) return tainted;
  walk(fn.body, (node) => {
    if (!ts.isVariableDeclaration(node)) return;
    if (!node.initializer) return;
    if (!ts.isIdentifier(node.name)) return;
    if (containsWholeEnvUse(node.initializer)) {
      tainted.add(node.name.text);
    }
  });
  return tainted;
}

function findLeakReason(
  expr: ts.Node,
  taintedLocals: Set<string>
): string | null {
  if (containsWholeEnvUse(expr)) {
    return "references process.env beyond a single static key";
  }
  if (taintedLocals.size > 0) {
    let hit: string | null = null;
    walk(expr, (node) => {
      if (hit) return;
      if (ts.isIdentifier(node) && taintedLocals.has(node.text)) {
        hit = node.text;
      }
    });
    if (hit) {
      return `returns local "${hit}" which aliases process.env`;
    }
  }
  return null;
}

// True if the expression tree contains a `process.env` usage that exposes the
// whole object — anything other than `process.env.KEY` with a static key.
function containsWholeEnvUse(node: ts.Node): boolean {
  let found = false;
  walk(node, (n) => {
    if (found) return;
    if (!isProcessEnv(n)) return;
    const parent = n.parent;
    if (
      parent &&
      ts.isPropertyAccessExpression(parent) &&
      parent.expression === n &&
      ts.isIdentifier(parent.name)
    ) {
      return; // process.env.KEY — specific static read, allowed
    }
    if (
      parent &&
      ts.isElementAccessExpression(parent) &&
      parent.expression === n &&
      (ts.isStringLiteral(parent.argumentExpression) ||
        ts.isNoSubstitutionTemplateLiteral(parent.argumentExpression))
    ) {
      return; // process.env["KEY"] — specific static read, allowed
    }
    found = true;
  });
  return found;
}

function isProcessEnv(node: ts.Node): node is ts.PropertyAccessExpression {
  return (
    ts.isPropertyAccessExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === "process" &&
    node.name.text === "env"
  );
}

export default rule;
