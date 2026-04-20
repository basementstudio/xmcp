import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import {
  findNamedExport,
  findObjectProperty,
  getPropertyName,
} from "../../ast/visit";

const ID = "XMCP-COMPLY-003";

const rule: Rule = {
  meta: {
    id: ID,
    name: "prompt-argument-mismatch",
    description:
      "Prompt files declaring a schema must have handlers that actually consume those arguments",
    severity: "medium",
    concern: "compliance",
    rationale:
      "If a prompt declares `{ name }` but the handler never references " +
      "name, the model is told a field matters and then sees evidence it " +
      "doesn't — that drifts toward prompt-injection.",
    examples: {
      bad:
        "export const schema = { topic: z.string() };\n" +
        'export default async () => ({ content: "Fixed prompt" });',
      good:
        "export const schema = { topic: z.string() };\n" +
        "export default async ({ topic }) => ({ content: `About ${topic}` });",
    },
    heuristic: true,
  },
  check(ctx): Finding[] {
    const findings: Finding[] = [];
    for (const file of ctx.prompts) {
      const schema = findNamedExport(file.sourceFile, "schema");
      if (!schema || !ts.isObjectLiteralExpression(schema)) continue;
      const declaredArgs: string[] = [];
      for (const prop of schema.properties) {
        if (!ts.isPropertyAssignment(prop)) continue;
        const key = getPropertyName(prop);
        if (key) declaredArgs.push(key);
      }
      if (declaredArgs.length === 0) continue;

      const missing = declaredArgs.filter(
        (arg) => !new RegExp(`\\b${escapeRegex(arg)}\\b`).test(file.source)
      );
      // Filter out the schema key itself — it appears in the literal.
      const trulyMissing = missing.filter((arg) => {
        const occurrences = file.source.match(
          new RegExp(`\\b${escapeRegex(arg)}\\b`, "g")
        );
        return !occurrences || occurrences.length < 2;
      });
      if (trulyMissing.length === 0) continue;

      const { line, column } = getLineColumn(
        file.sourceFile,
        schema.getStart(file.sourceFile)
      );
      findings.push({
        ruleId: ID,
        severity: "medium",
        concern: "compliance",
        message: `Prompt declares arguments that the handler never references: ${trulyMissing.join(", ")}`,
        file: file.absolutePath,
        line,
        column,
        suggestion:
          "Either consume the argument in the handler or remove it from the schema",
      });
    }
    return findings;
  },
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Silence unused import when the helper isn't referenced above.
void findObjectProperty;

export default rule;
