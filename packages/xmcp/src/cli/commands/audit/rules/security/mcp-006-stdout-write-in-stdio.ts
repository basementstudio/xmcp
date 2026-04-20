import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import { getConfigObject } from "../../ast/config-parser";
import { findObjectProperty, walk } from "../../ast/visit";

const ID = "XMCP-MCP-006";

// console methods that write to stdout. console.error / console.warn target
// stderr and are safe under stdio transport.
const STDOUT_CONSOLE_METHODS = new Set([
  "log",
  "info",
  "debug",
  "dir",
  "trace",
]);

const rule: Rule = {
  meta: {
    id: ID,
    name: "stdout-write-under-stdio-transport",
    description:
      "stdout writes in handlers corrupt the JSON-RPC channel when stdio transport is enabled",
    severity: "high",
    concern: "security",
    rationale:
      "Under stdio transport, the process's stdout is the protocol channel. " +
      "Any console.log / process.stdout.write interleaves with JSON-RPC " +
      "frames, breaks the client, and can leak server state to whoever " +
      "captures the transcript. Diagnostics belong on stderr.",
    examples: {
      bad: 'export default async () => { process.stdout.write("called\\n"); return "ok"; };',
      good: 'export default async () => { process.stderr.write("called\\n"); return "ok"; };',
    },
  },
  check(ctx): Finding[] {
    if (!isStdioTransportActive(ctx.xmcpConfigFile)) return [];

    const findings: Finding[] = [];
    const files = [...ctx.tools, ...ctx.prompts, ...ctx.resources];

    for (const file of files) {
      walk(file.sourceFile, (node) => {
        if (!ts.isCallExpression(node)) return;
        const sink = matchStdoutSink(node.expression);
        if (!sink) return;
        const { line, column } = getLineColumn(
          file.sourceFile,
          node.getStart(file.sourceFile)
        );
        findings.push({
          ruleId: ID,
          severity: "high",
          concern: "security",
          message: `${sink} writes to stdout under stdio transport — corrupts the JSON-RPC channel`,
          file: file.absolutePath,
          line,
          column,
          suggestion:
            "Use console.error or process.stderr.write for diagnostics. For structured logs, emit MCP logging notifications instead.",
        });
      });
    }
    return findings;
  },
};

// Returns null when the TS config says `stdio: false`. Any other state —
// explicit true, object, or missing — leaves stdio active per xmcp defaults.
function isStdioTransportActive(
  configFile: Parameters<typeof getConfigObject>[0]
): boolean {
  if (!configFile) return false;
  const info = getConfigObject(configFile);
  if (!info) return false;
  const stdioProp = findObjectProperty(info.object, "stdio");
  if (!stdioProp) return true;
  return stdioProp.initializer.kind !== ts.SyntaxKind.FalseKeyword;
}

function matchStdoutSink(callee: ts.Expression): string | null {
  if (!ts.isPropertyAccessExpression(callee)) return null;

  // console.<method>(...)
  if (
    ts.isIdentifier(callee.expression) &&
    callee.expression.text === "console" &&
    STDOUT_CONSOLE_METHODS.has(callee.name.text)
  ) {
    return `console.${callee.name.text}()`;
  }

  // process.stdout.write(...)
  if (
    callee.name.text === "write" &&
    ts.isPropertyAccessExpression(callee.expression) &&
    ts.isIdentifier(callee.expression.expression) &&
    callee.expression.expression.text === "process" &&
    callee.expression.name.text === "stdout"
  ) {
    return "process.stdout.write()";
  }
  return null;
}

export default rule;
