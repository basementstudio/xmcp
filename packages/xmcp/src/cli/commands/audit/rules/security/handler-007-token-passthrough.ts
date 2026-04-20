import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import {
  collectHandlerParamBindings,
  findHandlerFunction,
  referencesBinding,
  walk,
} from "../../ast/visit";

const ID = "XMCP-HANDLER-007";

const rule: Rule = {
  meta: {
    id: ID,
    name: "token-passthrough",
    description:
      "Tool handlers must not forward the caller's auth credential to an outbound request",
    severity: "high",
    concern: "security",
    rationale:
      "Relaying an inbound MCP Authorization header to an upstream API is " +
      "the confused-deputy anti-pattern that MCP spec 2025-06-18 §3.10 " +
      "explicitly prohibits. Mint an audience-bound token (RFC 8707) or use " +
      "a service identity instead.",
    examples: {
      bad:
        "export default async ({ id }, extra) => {\n" +
        "  return fetch(url, { headers: { Authorization: extra.authInfo.token } });\n" +
        "};",
      good:
        "const SERVICE_TOKEN = process.env.SERVICE_TOKEN!;\n" +
        "export default async ({ id }, extra) => {\n" +
        "  if (!extra.authInfo?.scopes?.includes('read')) throw new Error('denied');\n" +
        "  return fetch(url, { headers: { Authorization: `Bearer ${SERVICE_TOKEN}` } });\n" +
        "};",
    },
    heuristic: true,
  },
  check(ctx): Finding[] {
    const findings: Finding[] = [];
    for (const file of ctx.tools) {
      const handler = findHandlerFunction(file.sourceFile);
      if (!handler) continue;
      if (handler.parameters.length < 2) continue;

      const tainted = collectAuthTainted(handler);
      if (tainted.size === 0) continue;

      walk(handler, (node) => {
        if (!ts.isCallExpression(node)) return;
        if (!isOutboundHttpCall(node)) return;
        const forwarded = findForwardedArg(node, tainted);
        if (!forwarded) return;
        const { line, column } = getLineColumn(
          file.sourceFile,
          node.getStart(file.sourceFile)
        );
        findings.push({
          ruleId: ID,
          severity: "high",
          concern: "security",
          message: `outbound ${describeCallee(node)} receives the caller's auth credential — confused-deputy / token passthrough`,
          file: file.absolutePath,
          line,
          column,
          suggestion:
            "Do not relay the client's Authorization. Use a server-side service credential or mint an audience-bound token per RFC 8707.",
        });
      });
    }
    return findings;
  },
};

// Seeds taint from the second handler parameter (authInfo-bearing), then
// propagates to any local variable whose initializer references a tainted
// name. One fixed pass is enough for common flat patterns like
// `const token = extra.authInfo.token;`.
function collectAuthTainted(fn: ts.FunctionLikeDeclaration): Set<string> {
  const tainted = collectHandlerParamBindings(fn, 1);
  if (tainted.size === 0) return tainted;
  if (!fn.body || !ts.isBlock(fn.body)) return tainted;

  let changed = true;
  while (changed) {
    changed = false;
    walk(fn.body, (node) => {
      if (!ts.isVariableDeclaration(node)) return;
      if (!ts.isIdentifier(node.name)) return;
      if (tainted.has(node.name.text)) return;
      if (!node.initializer) return;
      if (referencesBinding(node.initializer, tainted)) {
        tainted.add(node.name.text);
        changed = true;
      }
    });
  }
  return tainted;
}

function isOutboundHttpCall(node: ts.CallExpression): boolean {
  const { expression } = node;
  if (ts.isIdentifier(expression)) {
    return expression.text === "fetch";
  }
  if (!ts.isPropertyAccessExpression(expression)) return false;
  const root = expression.expression;
  if (!ts.isIdentifier(root)) return false;
  const lib = root.text;
  const method = expression.name.text;
  if (lib === "axios" || lib === "got" || lib === "ky") return true;
  if (lib === "undici" && method === "request") return true;
  if ((lib === "http" || lib === "https") && method === "request") return true;
  return false;
}

function findForwardedArg(
  node: ts.CallExpression,
  tainted: Set<string>
): ts.Node | null {
  for (const arg of node.arguments) {
    if (referencesBinding(arg, tainted)) return arg;
  }
  return null;
}

function describeCallee(node: ts.CallExpression): string {
  const { expression } = node;
  if (ts.isIdentifier(expression)) return `${expression.text}()`;
  if (ts.isPropertyAccessExpression(expression)) {
    const root = ts.isIdentifier(expression.expression)
      ? expression.expression.text
      : "?";
    return `${root}.${expression.name.text}()`;
  }
  return "call";
}

export default rule;
