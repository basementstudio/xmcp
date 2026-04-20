import type { Finding, Rule } from "../../types";
import {
  collectHandlerParamBindings,
  findHandlerFunction,
  findNamedExport,
} from "../../ast/visit";

const ID = "XMCP-SCHEMA-003";

const rule: Rule = {
  meta: {
    id: ID,
    name: "tool-missing-schema-export",
    description: "Tool files must export a `schema` constant",
    severity: "medium",
    concern: "quality",
    rationale:
      "Without an exported schema the tool loader can't derive a JSON " +
      "schema, and clients see the tool as accepting arbitrary input. " +
      "Even a tool with no arguments should `export const schema = {}`.",
    examples: {
      bad: 'export const metadata = { name: "ping", description: "ping" };',
      good:
        "export const schema = {};\n" +
        'export const metadata = { name: "ping", description: "ping" };',
    },
  },
  check(ctx): Finding[] {
    const findings: Finding[] = [];
    for (const file of ctx.tools) {
      const schema = findNamedExport(file.sourceFile, "schema");
      if (schema) continue;
      // A tool whose handler takes no arguments doesn't need a schema;
      // it accepts no input. Only flag when the handler destructures input.
      const handler = findHandlerFunction(file.sourceFile);
      if (!handler) continue;
      const bindings = collectHandlerParamBindings(handler);
      if (bindings.size === 0) continue;
      findings.push({
        ruleId: ID,
        severity: "medium",
        concern: "quality",
        message: "Tool handler destructures input but no `schema` is exported",
        file: file.absolutePath,
        line: 1,
        column: 1,
        suggestion: "Add `export const schema = { ... };` to the tool file",
      });
    }
    return findings;
  },
};

export default rule;
