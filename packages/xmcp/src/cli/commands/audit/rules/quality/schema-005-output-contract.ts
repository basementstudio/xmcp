import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import { findHandlerFunction, findNamedExport, walk } from "../../ast/visit";

const ID = "XMCP-SCHEMA-005";

const rule: Rule = {
  meta: {
    id: ID,
    name: "output-schema-contract",
    description:
      "Handlers with an exported outputSchema should validate returns through it",
    severity: "medium",
    concern: "quality",
    rationale:
      "An exported outputSchema only advertises the contract — it does " +
      "not enforce it. Handlers that return untyped objects can silently " +
      "drift from the schema clients and LLMs rely on. Run the return " +
      "value through outputSchema.parse so the contract is checked at " +
      "runtime.",
    heuristic: true,
    examples: {
      bad:
        "export const outputSchema = z.object({ id: z.string() });\n" +
        'export default async (_) => ({ id: "abc" });',
      good:
        "export const outputSchema = z.object({ id: z.string() });\n" +
        'export default async (_) => outputSchema.parse({ id: "abc" });',
    },
  },
  check(ctx): Finding[] {
    const findings: Finding[] = [];
    for (const file of ctx.tools) {
      const outputSchema = findNamedExport(file.sourceFile, "outputSchema");
      if (!outputSchema) continue;
      const handler = findHandlerFunction(file.sourceFile);
      if (!handler) continue;
      const text = handler.getText(file.sourceFile);
      if (/\boutputSchema\s*\.\s*(?:parse|safeParse)\b/.test(text)) continue;

      const returnNode = findReturnSite(handler);
      const pos = returnNode
        ? returnNode.getStart(file.sourceFile)
        : handler.getStart(file.sourceFile);
      const { line, column } = getLineColumn(file.sourceFile, pos);
      findings.push({
        ruleId: ID,
        severity: "medium",
        concern: "quality",
        message:
          "Tool exports outputSchema but the handler does not validate its return through it",
        file: file.absolutePath,
        line,
        column,
        suggestion:
          "Wrap the return with outputSchema.parse(...) or .safeParse",
      });
    }
    return findings;
  },
};

function findReturnSite(fn: ts.FunctionLikeDeclaration): ts.Node | null {
  if (!fn.body) return null;
  if (!ts.isBlock(fn.body)) return fn.body;
  let first: ts.Node | null = null;
  walk(fn.body, (node) => {
    if (!first && ts.isReturnStatement(node)) first = node;
  });
  return first;
}

export default rule;
