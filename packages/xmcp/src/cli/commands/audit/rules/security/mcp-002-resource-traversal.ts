import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import {
  collectHandlerParamBindings,
  findHandlerFunction,
  getCalleeName,
  referencesBinding,
  walk,
} from "../../ast/visit";

const ID = "XMCP-MCP-002";

const FS_METHODS = new Set([
  "readFile",
  "readFileSync",
  "createReadStream",
  "stat",
  "statSync",
  "lstat",
  "lstatSync",
  "realpath",
]);

const TRAVERSAL_GUARDS = /\b(?:path\.resolve|path\.normalize|startsWith)\b/;

const rule: Rule = {
  meta: {
    id: ID,
    name: "resource-handler-path-traversal",
    description:
      "Resource handlers must guard filesystem access against path traversal",
    severity: "high",
    concern: "security",
    rationale:
      "MCP resources are typically filesystem-backed; URI params land " +
      "directly in fs.* calls. Without a traversal guard (path.resolve + " +
      "prefix check), a caller can read arbitrary files.",
    examples: {
      bad: 'export default async ({ uri }) => fs.readFile(uri, "utf8");',
      good:
        "const resolved = path.resolve(ROOT, requested);\n" +
        'if (!resolved.startsWith(ROOT)) throw new Error("outside root");',
    },
  },
  check(ctx): Finding[] {
    const findings: Finding[] = [];
    for (const file of ctx.resources) {
      const handler = findHandlerFunction(file.sourceFile);
      if (!handler) continue;
      const bindings = collectHandlerParamBindings(handler);
      if (bindings.size === 0) continue;
      if (TRAVERSAL_GUARDS.test(handler.getText(file.sourceFile))) continue;

      walk(handler, (node) => {
        if (!ts.isCallExpression(node)) return;
        const name = getCalleeName(node);
        if (!name || !FS_METHODS.has(name)) return;
        const firstArg = node.arguments[0];
        if (!firstArg || !referencesBinding(firstArg, bindings)) return;
        const { line, column } = getLineColumn(
          file.sourceFile,
          node.getStart(file.sourceFile)
        );
        findings.push({
          ruleId: ID,
          severity: "high",
          concern: "security",
          message: `Resource ${name}() uses unguarded path from handler input`,
          file: file.absolutePath,
          line,
          column,
          suggestion:
            "Resolve the path against an allowlisted root and verify it stays inside",
        });
      });
    }
    return findings;
  },
};

export default rule;
