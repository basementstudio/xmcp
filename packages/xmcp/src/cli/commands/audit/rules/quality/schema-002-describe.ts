import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import {
  collectZodChainMethods,
  findNamedExport,
  getPropertyName,
} from "../../ast/visit";

const ID = "XMCP-SCHEMA-002";

const rule: Rule = {
  meta: {
    id: ID,
    name: "schema-field-missing-describe",
    description: "Every zod schema field should have a .describe() call",
    severity: "low",
    concern: "quality",
    rationale:
      "Descriptions surface to the LLM as part of the tool contract. " +
      "Without them the model guesses what a field means, which hurts " +
      "tool-use accuracy and increases prompt-injection risk.",
    examples: {
      bad: "export const schema = { name: z.string() };",
      good:
        "export const schema = {\n" +
        '  name: z.string().describe("The user\'s display name"),\n' +
        "};",
    },
  },
  check(ctx): Finding[] {
    const findings: Finding[] = [];
    for (const file of ctx.tools) {
      const schema = findNamedExport(file.sourceFile, "schema");
      if (!schema || !ts.isObjectLiteralExpression(schema)) continue;
      for (const prop of schema.properties) {
        if (!ts.isPropertyAssignment(prop)) continue;
        const key = getPropertyName(prop);
        if (!key) continue;
        const methods = collectZodChainMethods(prop.initializer);
        if (methods.has("describe")) continue;
        const { line, column } = getLineColumn(
          file.sourceFile,
          prop.getStart(file.sourceFile)
        );
        findings.push({
          ruleId: ID,
          severity: "low",
          concern: "quality",
          message: `Schema field "${key}" is missing .describe()`,
          file: file.absolutePath,
          line,
          column,
          suggestion: 'Chain .describe("what this field is") onto the zod type',
        });
      }
    }
    return findings;
  },
};

export default rule;
