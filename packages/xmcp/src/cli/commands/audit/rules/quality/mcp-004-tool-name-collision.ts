import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import {
  findNamedExport,
  findObjectProperty,
  getStringLiteralValue,
} from "../../ast/visit";

const ID = "XMCP-MCP-004";

const COLLIDING_NAMES = new Set([
  "read_file",
  "write_file",
  "execute",
  "exec",
  "run",
  "run_command",
  "shell",
  "bash",
  "terminal",
  "eval",
  "python",
]);

const rule: Rule = {
  meta: {
    id: ID,
    name: "tool-name-collision",
    description:
      "Tool names should not collide with common built-in tool names used by MCP clients",
    severity: "low",
    concern: "quality",
    rationale:
      "When an xmcp tool shares a name with a well-known built-in (e.g., " +
      "`read_file` in Claude Desktop), clients may shadow one or the " +
      "other unpredictably. The LLM also tends to confuse them.",
    examples: {
      bad: 'export const metadata = { name: "read_file", description: "Read a file" };',
      good: 'export const metadata = { name: "read_project_file", description: "Read a project file" };',
    },
  },
  check(ctx): Finding[] {
    const findings: Finding[] = [];
    for (const file of ctx.tools) {
      const meta = findNamedExport(file.sourceFile, "metadata");
      if (!meta || !ts.isObjectLiteralExpression(meta)) continue;
      const nameProp = findObjectProperty(meta, "name");
      if (!nameProp) continue;
      const name = getStringLiteralValue(nameProp.initializer);
      if (!name || !COLLIDING_NAMES.has(name)) continue;
      const { line, column } = getLineColumn(
        file.sourceFile,
        nameProp.getStart(file.sourceFile)
      );
      findings.push({
        ruleId: ID,
        severity: "low",
        concern: "quality",
        message: `Tool name "${name}" collides with a common built-in`,
        file: file.absolutePath,
        line,
        column,
        suggestion: "Namespace the tool (e.g. prefix with the service name)",
      });
    }
    return findings;
  },
};

export default rule;
