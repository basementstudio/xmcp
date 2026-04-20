import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import { findHandlerFunction, walk } from "../../ast/visit";

const ID = "XMCP-MCP-010";

const ACTION_CHECK = /\.\s*action\b/;

const rule: Rule = {
  meta: {
    id: ID,
    name: "elicit-result-action-unchecked",
    description:
      "Handlers that call extra.elicit() must inspect result.action before using the content",
    severity: "medium",
    concern: "compliance",
    rationale:
      "elicit() returns { action, content }. When the user declines or " +
      "cancels, action is 'decline' or 'cancel' and content is undefined. " +
      "Handlers that use the result directly will crash on decline, or " +
      "worse, proceed as if the user accepted empty input.",
    heuristic: true,
    examples: {
      bad:
        "const r = await extra.elicit({ message: 'name?', schema: {} });\n" +
        "return await fs.promises.writeFile(path, r.content.name);",
      good:
        "const r = await extra.elicit({ message: 'name?', schema: {} });\n" +
        'if (r.action !== "accept") throw new Error("cancelled");\n' +
        "return await fs.promises.writeFile(path, r.content.name);",
    },
  },
  check(ctx): Finding[] {
    const findings: Finding[] = [];
    for (const file of ctx.tools) {
      const handler = findHandlerFunction(file.sourceFile);
      if (!handler) continue;
      walk(handler, (node) => {
        if (!ts.isCallExpression(node)) return;
        if (!isElicitCall(node)) return;
        const handlerText = handler.getText(file.sourceFile);
        if (ACTION_CHECK.test(handlerText)) return;
        const { line, column } = getLineColumn(
          file.sourceFile,
          node.getStart(file.sourceFile)
        );
        findings.push({
          ruleId: ID,
          severity: "medium",
          concern: "compliance",
          message:
            "elicit() result used without checking result.action — decline/cancel paths will misbehave",
          file: file.absolutePath,
          line,
          column,
          suggestion:
            'Guard with `if (result.action !== "accept") { ... }` before using result.content',
        });
      });
    }
    return findings;
  },
};

function isElicitCall(node: ts.CallExpression): boolean {
  const { expression } = node;
  if (!ts.isPropertyAccessExpression(expression)) return false;
  return expression.name.text === "elicit";
}

export default rule;
