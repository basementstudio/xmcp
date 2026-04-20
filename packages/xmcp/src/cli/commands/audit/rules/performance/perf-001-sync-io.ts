import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import { walk } from "../../ast/visit";

const ID = "XMCP-PERF-001";

const SYNC_METHODS = new Set([
  "readFileSync",
  "writeFileSync",
  "existsSync",
  "statSync",
  "lstatSync",
  "readdirSync",
  "mkdirSync",
  "rmSync",
  "unlinkSync",
  "appendFileSync",
]);

const rule: Rule = {
  meta: {
    id: ID,
    name: "sync-io-in-handler",
    description:
      "Tool, prompt, or resource handlers must not use synchronous fs APIs",
    severity: "medium",
    concern: "performance",
    rationale:
      "Synchronous I/O blocks Node's event loop. When multiple tool calls " +
      "run concurrently on the same server, a single readFileSync stalls " +
      "every in-flight request.",
    examples: {
      bad:
        'import { readFileSync } from "fs";\n' +
        'export default async () => readFileSync("data.json", "utf8");',
      good:
        'import { readFile } from "fs/promises";\n' +
        'export default async () => await readFile("data.json", "utf8");',
    },
  },
  check(ctx): Finding[] {
    const findings: Finding[] = [];
    const filesToCheck = [...ctx.tools, ...ctx.prompts, ...ctx.resources];

    for (const file of filesToCheck) {
      walk(file.sourceFile, (node) => {
        if (!ts.isCallExpression(node)) return;
        const name = getCalleeName(node);
        if (!name || !SYNC_METHODS.has(name)) return;
        const { line, column } = getLineColumn(
          file.sourceFile,
          node.getStart(file.sourceFile)
        );
        findings.push({
          ruleId: ID,
          severity: "medium",
          concern: "performance",
          message: `${name}() blocks the event loop in a handler`,
          file: file.absolutePath,
          line,
          column,
          suggestion: `Use the async equivalent from "node:fs/promises"`,
        });
      });
    }
    return findings;
  },
};

function getCalleeName(node: ts.CallExpression): string | null {
  const { expression } = node;
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) return expression.name.text;
  return null;
}

export default rule;
