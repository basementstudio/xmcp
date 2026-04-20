import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import {
  collectHandlerParamBindings,
  findHandlerFunction,
  getCalleeName,
  walk,
} from "../../ast/visit";

const ID = "XMCP-MCP-011";

const FS_METHODS = new Set([
  "readFile",
  "readFileSync",
  "createReadStream",
  "stat",
  "statSync",
]);

const DECODE_MARKERS = /\b(?:decodeURIComponent|decodeURI|URL\b|new\s+URL)\b/;
const TRAVERSAL_GUARD = /\bpath\.resolve\b/;

const rule: Rule = {
  meta: {
    id: ID,
    name: "resource-uri-not-canonicalized",
    description:
      "Resource handlers should decode URI components before resolving paths",
    severity: "high",
    concern: "security",
    rationale:
      "MCP resource URIs arrive percent-encoded. Passing them straight into " +
      "path.resolve leaves %2e%2e (`../`) and %2f (`/`) intact, so a " +
      "startsWith() check happily accepts traversal. Canonicalize with " +
      "decodeURIComponent or new URL() before resolving.",
    heuristic: true,
    examples: {
      bad:
        "const resolved = path.resolve(ROOT, uri);\n" +
        'if (!resolved.startsWith(ROOT)) throw new Error("outside");',
      good:
        "const decoded = decodeURIComponent(uri);\n" +
        "const resolved = path.resolve(ROOT, decoded);\n" +
        'if (!resolved.startsWith(ROOT)) throw new Error("outside");',
    },
  },
  check(ctx): Finding[] {
    const findings: Finding[] = [];
    for (const file of ctx.resources) {
      const handler = findHandlerFunction(file.sourceFile);
      if (!handler) continue;
      const bindings = collectHandlerParamBindings(handler);
      if (bindings.size === 0) continue;
      const handlerText = handler.getText(file.sourceFile);
      // Only care about handlers that resolve paths at all — untracked
      // fs access is MCP-002's territory.
      if (!TRAVERSAL_GUARD.test(handlerText)) continue;
      if (DECODE_MARKERS.test(handlerText)) continue;

      // Flag the first fs call inside the handler; the path arrives from
      // handler input by construction (path.resolve is present + bindings
      // are the only source of dynamic paths in MCP resource handlers).
      let reported = false;
      walk(handler, (node) => {
        if (reported) return;
        if (!ts.isCallExpression(node)) return;
        const name = getCalleeName(node);
        if (!name || !FS_METHODS.has(name)) return;
        const { line, column } = getLineColumn(
          file.sourceFile,
          node.getStart(file.sourceFile)
        );
        findings.push({
          ruleId: ID,
          severity: "high",
          concern: "security",
          message:
            "Resource handler resolves a URI path without decoding it first",
          file: file.absolutePath,
          line,
          column,
          suggestion:
            "Apply decodeURIComponent (or parse with new URL()) before path.resolve",
        });
        reported = true;
      });
    }
    return findings;
  },
};

export default rule;
