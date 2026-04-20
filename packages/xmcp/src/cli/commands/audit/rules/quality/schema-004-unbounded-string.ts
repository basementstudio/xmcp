import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import {
  collectZodChainMethods,
  findNamedExport,
  getPropertyName,
} from "../../ast/visit";

const ID = "XMCP-SCHEMA-004";

const rule: Rule = {
  meta: {
    id: ID,
    name: "unbounded-zod-string",
    description: "zod string fields should cap length with .max()",
    severity: "low",
    concern: "quality",
    rationale:
      "An unbounded string field lets a caller paste megabytes of text " +
      "into the handler. That wastes the model's context budget and gives " +
      "an attacker cheap amplification for other abuses.",
    examples: {
      bad: 'name: z.string().describe("...")',
      good: 'name: z.string().max(200).describe("...")',
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
        if (!methods.has("string")) continue;
        if (methods.has("max")) continue;
        const { line, column } = getLineColumn(
          file.sourceFile,
          prop.getStart(file.sourceFile)
        );
        findings.push({
          ruleId: ID,
          severity: "low",
          concern: "quality",
          message: `Schema field "${key}" is an unbounded z.string()`,
          file: file.absolutePath,
          line,
          column,
          suggestion: "Add .max(N) to cap input length",
        });
      }
    }
    return findings;
  },
};

export default rule;
