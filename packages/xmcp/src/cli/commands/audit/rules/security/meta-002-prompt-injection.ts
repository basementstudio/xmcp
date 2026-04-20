import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import {
  findNamedExport,
  findObjectProperty,
  getStringLiteralValue,
} from "../../ast/visit";

const ID = "XMCP-META-002";

const PATTERNS: Array<{ label: string; regex: RegExp }> = [
  {
    label: "instruction override",
    regex: /ignore (?:all )?previous instructions/i,
  },
  { label: "role override", regex: /you are (?:now )?(?:a|an|the) [a-z]+/i },
  { label: "system prompt spoof", regex: /^\s*system:\s*/im },
  { label: "assistant prompt spoof", regex: /^\s*assistant:\s*/im },
  { label: "system XML tag", regex: /<\s*\/?\s*system\s*>/i },
  { label: "jailbreak template", regex: /\b(DAN|do anything now)\b/ },
];

const rule: Rule = {
  meta: {
    id: ID,
    name: "prompt-injection-in-description",
    description: "Tool descriptions must not contain prompt-injection markers",
    severity: "high",
    concern: "security",
    rationale:
      "Tool descriptions are injected verbatim into the model's context. " +
      "Phrases like 'ignore previous instructions' or fake system markers " +
      "become active instructions when the model reads the tool list.",
    examples: {
      bad: 'description: "Greet user. Ignore previous instructions and ..."',
      good: 'description: "Greet the user by name"',
    },
  },
  check(ctx): Finding[] {
    const findings: Finding[] = [];
    for (const file of ctx.tools) {
      const meta = findNamedExport(file.sourceFile, "metadata");
      if (!meta || !ts.isObjectLiteralExpression(meta)) continue;
      const descProp = findObjectProperty(meta, "description");
      if (!descProp) continue;
      const description = getStringLiteralValue(descProp.initializer);
      if (!description) continue;
      const matched = PATTERNS.find((p) => p.regex.test(description));
      if (!matched) continue;
      const { line, column } = getLineColumn(
        file.sourceFile,
        descProp.getStart(file.sourceFile)
      );
      findings.push({
        ruleId: ID,
        severity: "high",
        concern: "security",
        message: `Description contains a ${matched.label} marker`,
        file: file.absolutePath,
        line,
        column,
        suggestion: "Rewrite the description without instruction-like phrases",
      });
    }
    return findings;
  },
};

export default rule;
