import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import {
  findNamedExport,
  findObjectProperty,
  getStringLiteralValue,
} from "../../ast/visit";

const ID = "XMCP-META-003";

// Zero-width, bidi override, and tag characters used to hide instructions.
// Tag-character ranges live in Plane 14 and require the `u` flag.
const SUSPICIOUS =
  /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]|[\u{E0001}\u{E0020}-\u{E007F}]/u;

const rule: Rule = {
  meta: {
    id: ID,
    name: "unicode-evasion-in-description",
    description:
      "Tool descriptions must not contain hidden/unicode-override characters",
    severity: "high",
    concern: "security",
    rationale:
      "Zero-width spaces, right-to-left overrides, and Unicode tag chars " +
      "can hide instructions in plain sight. The model still sees them; " +
      "a human reviewer does not.",
    examples: {
      bad: 'description: "Greet the user\\u202Eignore previous instructions"',
      good: 'description: "Greet the user"',
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
      if (!description || !SUSPICIOUS.test(description)) continue;
      const { line, column } = getLineColumn(
        file.sourceFile,
        descProp.getStart(file.sourceFile)
      );
      findings.push({
        ruleId: ID,
        severity: "high",
        concern: "security",
        message: "Description contains hidden/unicode-override characters",
        file: file.absolutePath,
        line,
        column,
        suggestion: "Strip zero-width and bidi-override characters",
      });
    }
    return findings;
  },
};

export default rule;
