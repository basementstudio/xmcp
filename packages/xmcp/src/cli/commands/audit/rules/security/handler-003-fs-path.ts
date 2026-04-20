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

const ID = "XMCP-HANDLER-003";

const FS_METHODS = new Set([
  "readFile",
  "readFileSync",
  "writeFile",
  "writeFileSync",
  "createReadStream",
  "createWriteStream",
  "appendFile",
  "appendFileSync",
  "unlink",
  "unlinkSync",
  "rm",
  "rmSync",
]);

const NORMALIZERS = /\b(?:path\.resolve|path\.normalize|path\.join)\b/;

const rule: Rule = {
  meta: {
    id: ID,
    name: "fs-path-from-user-input",
    description:
      "Tool handlers must normalize filesystem paths that come from user input",
    severity: "high",
    concern: "security",
    rationale:
      "A raw handler parameter used as a file path lets a caller escape " +
      "the intended directory with `../../etc/passwd`. path.resolve plus " +
      "a whitelist prefix check is the minimum defense.",
    examples: {
      bad: 'readFile(path, "utf8")  // path is a handler param',
      good:
        "const safe = path.resolve(root, requested);\n" +
        'if (!safe.startsWith(root)) throw new Error("outside root");',
    },
    heuristic: true,
  },
  check(ctx): Finding[] {
    const findings: Finding[] = [];
    for (const file of ctx.tools) {
      const handler = findHandlerFunction(file.sourceFile);
      if (!handler) continue;
      const bindings = collectHandlerParamBindings(handler);
      if (bindings.size === 0) continue;

      walk(handler, (node) => {
        if (!ts.isCallExpression(node)) return;
        const name = getCalleeName(node);
        if (!name || !FS_METHODS.has(name)) return;
        const firstArg = node.arguments[0];
        if (!firstArg) return;
        if (!referencesBinding(firstArg, bindings)) return;
        // If the enclosing statement already wraps with path.resolve/normalize,
        // downgrade to no-finding (heuristic — we can't prove safety, but we
        // don't want to nag when the author clearly considered it).
        const enclosingText = firstArg.getText(file.sourceFile);
        if (NORMALIZERS.test(enclosingText)) return;
        const { line, column } = getLineColumn(
          file.sourceFile,
          node.getStart(file.sourceFile)
        );
        findings.push({
          ruleId: ID,
          severity: "high",
          concern: "security",
          message: `${name}() path derives from handler input without normalization`,
          file: file.absolutePath,
          line,
          column,
          suggestion:
            "Wrap the path with path.resolve and verify it stays inside an allowlisted root",
        });
      });
    }
    return findings;
  },
};

export default rule;
