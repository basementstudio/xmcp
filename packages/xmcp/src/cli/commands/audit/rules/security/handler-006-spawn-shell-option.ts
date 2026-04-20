import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import {
  findObjectProperty,
  getCalleeName,
  getStringLiteralValue,
  walk,
} from "../../ast/visit";

const ID = "XMCP-HANDLER-006";

// Programs that invoke a command interpreter when passed -c/-C/-e and a string
const SHELL_PROGRAMS = new Set([
  "sh",
  "bash",
  "zsh",
  "dash",
  "ksh",
  "ash",
  "cmd",
  "cmd.exe",
  "powershell",
  "powershell.exe",
  "pwsh",
]);

// Switches that turn the next argv entry into a shell-evaluated string
const SHELL_EVAL_SWITCHES = new Set(["-c", "/c", "-Command"]);

const rule: Rule = {
  meta: {
    id: ID,
    name: "spawn-shell-option",
    description:
      "child_process APIs must not invoke a shell (shell: true, or sh -c)",
    severity: "critical",
    concern: "security",
    rationale:
      "shell:true (and the equivalent `sh -c <string>` shape) routes every " +
      "argument through a command interpreter, so any single-quoted string " +
      "the caller controls becomes executable. This is dangerous even when " +
      "the arguments themselves look static — a later refactor that adds " +
      "interpolation turns it into RCE.",
    examples: {
      bad: 'spawn("tool", [userArg], { shell: true });',
      good: 'spawn("tool", [userArg]);',
    },
  },
  check(ctx): Finding[] {
    const findings: Finding[] = [];
    const files = [...ctx.tools, ...ctx.prompts, ...ctx.resources];

    for (const file of files) {
      walk(file.sourceFile, (node) => {
        if (!ts.isCallExpression(node)) return;
        const name = getCalleeName(node);
        if (!name) return;

        // spawn / spawnSync: options are the 3rd argument; shell-program as
        // the 1st argument with an eval switch in the 2nd is the same trap.
        if (name === "spawn" || name === "spawnSync") {
          const optionsArg = node.arguments[2];
          if (optionsArg && hasTruthyShellOption(optionsArg)) {
            findings.push(
              flag(
                file.absolutePath,
                file.sourceFile,
                node,
                "shell:true option"
              )
            );
            return;
          }
          const program = node.arguments[0];
          const argsArg = node.arguments[1];
          if (
            program &&
            argsArg &&
            isShellProgram(program) &&
            argsContainEvalSwitch(argsArg)
          ) {
            findings.push(
              flag(
                file.absolutePath,
                file.sourceFile,
                node,
                "shell program + -c"
              )
            );
          }
          return;
        }

        // exec / execSync accept options as the 2nd argument; shell:true there
        // is rarer but equally dangerous.
        if (
          name === "exec" ||
          name === "execSync" ||
          name === "execFile" ||
          name === "execFileSync"
        ) {
          const optionsArg = name.startsWith("execFile")
            ? node.arguments[2]
            : node.arguments[1];
          if (optionsArg && hasTruthyShellOption(optionsArg)) {
            findings.push(
              flag(
                file.absolutePath,
                file.sourceFile,
                node,
                "shell:true option"
              )
            );
          }
        }
      });
    }
    return findings;
  },
};

function hasTruthyShellOption(node: ts.Node): boolean {
  if (!ts.isObjectLiteralExpression(node)) return false;
  const prop = findObjectProperty(node, "shell");
  if (!prop) return false;
  // Only `shell: false` is explicitly safe; everything else (true, a shell
  // path string, a variable) invokes a shell.
  return prop.initializer.kind !== ts.SyntaxKind.FalseKeyword;
}

function isShellProgram(node: ts.Node): boolean {
  const value = getStringLiteralValue(node);
  if (!value) return false;
  const basename = value.split(/[\\/]/).pop() ?? value;
  return SHELL_PROGRAMS.has(basename);
}

function argsContainEvalSwitch(node: ts.Node): boolean {
  if (!ts.isArrayLiteralExpression(node)) return false;
  for (const element of node.elements) {
    const value = getStringLiteralValue(element);
    if (value && SHELL_EVAL_SWITCHES.has(value)) return true;
  }
  return false;
}

function flag(
  filePath: string,
  sourceFile: ts.SourceFile,
  call: ts.CallExpression,
  label: string
): Finding {
  const { line, column } = getLineColumn(sourceFile, call.getStart(sourceFile));
  return {
    ruleId: ID,
    severity: "critical",
    concern: "security",
    message: `child_process call invokes a shell (${label}) — command injection risk independent of argument taint`,
    file: filePath,
    line,
    column,
    suggestion:
      "Pass argv as an array and omit the shell option. If a shell is truly required, validate arguments against a strict allowlist first.",
  };
}

export default rule;
