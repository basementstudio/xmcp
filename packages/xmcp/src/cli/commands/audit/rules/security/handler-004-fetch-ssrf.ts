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

const ID = "XMCP-HANDLER-004";

const NETWORK_CALLS = new Set(["fetch", "request", "get", "post"]);

const ALLOWLIST_HINTS = /\b(?:startsWith|hostname|URL\(|allow(?:list|ed)?)\b/i;

const rule: Rule = {
  meta: {
    id: ID,
    name: "fetch-from-user-input",
    description:
      "Tool handlers must validate URLs that come from user input before fetching",
    severity: "high",
    concern: "security",
    rationale:
      "A handler that fetches a user-supplied URL is an SSRF engine: the " +
      "caller can pivot to internal services, cloud metadata, or the " +
      "Docker socket. Validate host against an allowlist before calling.",
    examples: {
      bad: "export default async ({ url }) => await fetch(url);",
      good:
        "const parsed = new URL(url);\n" +
        'if (!ALLOWED_HOSTS.has(parsed.hostname)) throw new Error("blocked");\n' +
        "await fetch(parsed);",
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
      if (ALLOWLIST_HINTS.test(file.source)) continue;

      walk(handler, (node) => {
        if (!ts.isCallExpression(node)) return;
        const name = getCalleeName(node);
        if (!name || !NETWORK_CALLS.has(name)) return;
        const firstArg = node.arguments[0];
        if (!firstArg) return;
        if (!referencesBinding(firstArg, bindings)) return;
        const { line, column } = getLineColumn(
          file.sourceFile,
          node.getStart(file.sourceFile)
        );
        findings.push({
          ruleId: ID,
          severity: "high",
          concern: "security",
          message: `${name}() URL derives from handler input with no allowlist check`,
          file: file.absolutePath,
          line,
          column,
          suggestion:
            "Parse with new URL(...) and reject hostnames outside a known allowlist",
        });
      });
    }
    return findings;
  },
};

export default rule;
