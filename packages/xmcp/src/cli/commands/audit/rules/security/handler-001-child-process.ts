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

const ID = "XMCP-HANDLER-001";

const DANGEROUS_METHODS = new Set([
  "exec",
  "execSync",
  "execFile",
  "execFileSync",
  "spawn",
  "spawnSync",
]);

const rule: Rule = {
  meta: {
    id: ID,
    name: "child-process-with-user-input",
    description:
      "Tool handlers must not pass handler parameters to child_process APIs",
    severity: "critical",
    concern: "security",
    rationale:
      "exec/spawn with user input is the canonical command-injection " +
      "vector. An MCP client can craft arguments that break out of the " +
      "shell context and run arbitrary commands on the server host.",
    examples: {
      bad:
        'import { exec } from "node:child_process";\n' +
        "export default async ({ host }) => exec(`ping ${host}`);",
      good:
        'import { execFile } from "node:child_process";\n' +
        'export default async ({ host }) => execFile("ping", [host]);',
    },
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
        if (!name || !DANGEROUS_METHODS.has(name)) return;
        const firstArg = node.arguments[0];
        if (!firstArg) return;
        if (!referencesBinding(firstArg, bindings)) return;
        const { line, column } = getLineColumn(
          file.sourceFile,
          node.getStart(file.sourceFile)
        );
        findings.push({
          ruleId: ID,
          severity: "critical",
          concern: "security",
          message: `${name}() argument derives from handler input — command injection`,
          file: file.absolutePath,
          line,
          column,
          suggestion:
            "Use execFile with an argv array, or sanitize input against a strict allowlist",
        });
      });
    }
    return findings;
  },
};

export default rule;
