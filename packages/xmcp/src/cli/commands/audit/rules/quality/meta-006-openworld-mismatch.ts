import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import {
  findHandlerFunction,
  findNamedExport,
  findObjectProperty,
  getCalleeName,
  walk,
} from "../../ast/visit";

const ID = "XMCP-META-006";

const rule: Rule = {
  meta: {
    id: ID,
    name: "openworld-hint-mismatch",
    description:
      "Tools with openWorldHint false should not make outbound network calls",
    severity: "medium",
    concern: "quality",
    rationale:
      "Clients interpret openWorldHint as whether the tool reaches outside " +
      "the current environment. Marking an internet-facing tool as closed " +
      "world misleads tool planners and approval UX.",
    heuristic: true,
    examples: {
      bad:
        "annotations: { openWorldHint: false }\n" +
        "await fetch('https://api.example.com/data');",
      good:
        "annotations: { openWorldHint: true }\n" +
        "await fetch('https://api.example.com/data');",
    },
  },
  check(ctx): Finding[] {
    const findings: Finding[] = [];
    for (const file of ctx.tools) {
      const metadata = findNamedExport(file.sourceFile, "metadata");
      if (!metadata || !ts.isObjectLiteralExpression(metadata)) continue;
      if (!hasOpenWorldFalse(metadata)) continue;

      const handler = findHandlerFunction(file.sourceFile);
      if (!handler) continue;
      const outbound = findOutboundCall(handler);
      if (!outbound) continue;

      const { line, column } = getLineColumn(
        file.sourceFile,
        outbound.getStart(file.sourceFile)
      );
      findings.push({
        ruleId: ID,
        severity: "medium",
        concern: "quality",
        message:
          "Tool sets openWorldHint: false but the handler makes an outbound network call",
        file: file.absolutePath,
        line,
        column,
        suggestion:
          "Set `openWorldHint: true` or keep the tool fully local/offline",
      });
    }
    return findings;
  },
};

function hasOpenWorldFalse(metadata: ts.ObjectLiteralExpression): boolean {
  const annotations = findObjectProperty(metadata, "annotations");
  if (!annotations || !ts.isObjectLiteralExpression(annotations.initializer)) {
    return false;
  }
  const openWorldHint = findObjectProperty(
    annotations.initializer,
    "openWorldHint"
  );
  return openWorldHint?.initializer.kind === ts.SyntaxKind.FalseKeyword;
}

function findOutboundCall(fn: ts.FunctionLikeDeclaration): ts.Node | null {
  let found: ts.Node | null = null;
  walk(fn, (node) => {
    if (found || !ts.isCallExpression(node)) return;
    const name = getCalleeName(node);
    if (!name) return;
    if (name === "fetch" || name === "request") {
      found = node;
      return;
    }
    if (!ts.isPropertyAccessExpression(node.expression)) return;
    const root = node.expression.expression;
    if (!ts.isIdentifier(root)) return;
    if (["axios", "got", "ky", "http", "https", "undici"].includes(root.text)) {
      found = node;
    }
  });
  return found;
}

export default rule;
