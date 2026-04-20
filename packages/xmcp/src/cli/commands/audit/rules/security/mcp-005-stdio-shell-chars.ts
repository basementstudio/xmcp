import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import {
  getConfigObject,
  getStringOrBooleanLiteral,
} from "../../ast/config-parser";
import { findObjectProperty } from "../../ast/visit";

const ID = "XMCP-MCP-005";

const SHELL_METACHARS = /[`$|&;><]|\\\$\(/;

const rule: Rule = {
  meta: {
    id: ID,
    name: "stdio-command-shell-metacharacters",
    description:
      "stdio transport command/args must not contain shell metacharacters",
    severity: "high",
    concern: "security",
    rationale:
      "When the stdio command is spawned through a shell, backticks, " +
      "$(...), and pipes become executable. Keep the command and its args " +
      "as literal strings.",
    examples: {
      bad: 'stdio: { command: "sh", args: ["-c", "my-server | tee log"] }',
      good: 'stdio: { command: "my-server", args: ["--log", "./log"] }',
    },
  },
  check(ctx): Finding[] {
    const info = getConfigObject(ctx.xmcpConfigFile);
    if (!info) return [];
    const stdioProp = findObjectProperty(info.object, "stdio");
    if (!stdioProp) return [];
    if (!ts.isObjectLiteralExpression(stdioProp.initializer)) return [];

    const commandProp = findObjectProperty(stdioProp.initializer, "command");
    const findings: Finding[] = [];
    if (commandProp) {
      const command = getStringOrBooleanLiteral(commandProp.initializer);
      if (typeof command === "string" && SHELL_METACHARS.test(command)) {
        findings.push(
          flag(ctx, commandProp, info.sourceFile, `command "${command}"`)
        );
      }
    }

    const argsProp = findObjectProperty(stdioProp.initializer, "args");
    if (argsProp && ts.isArrayLiteralExpression(argsProp.initializer)) {
      for (const element of argsProp.initializer.elements) {
        const value = getStringOrBooleanLiteral(element);
        if (typeof value === "string" && SHELL_METACHARS.test(value)) {
          findings.push(flag(ctx, element, info.sourceFile, `arg "${value}"`));
        }
      }
    }

    return findings;
  },
};

function flag(
  ctx: { xmcpConfigFile: { absolutePath: string } | null },
  node: ts.Node,
  sourceFile: ts.SourceFile,
  label: string
): Finding {
  const { line, column } = getLineColumn(sourceFile, node.getStart(sourceFile));
  return {
    ruleId: ID,
    severity: "high",
    concern: "security",
    message: `stdio ${label} contains shell metacharacters`,
    file: ctx.xmcpConfigFile!.absolutePath,
    line,
    column,
    suggestion: "Split command and arguments into literal strings only",
  };
}

export default rule;
