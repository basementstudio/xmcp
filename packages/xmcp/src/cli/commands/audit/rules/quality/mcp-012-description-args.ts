import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import {
  findNamedExport,
  findObjectProperty,
  getStringLiteralValue,
} from "../../ast/visit";

const ID = "XMCP-MCP-012";

const PLACEHOLDER = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;

const rule: Rule = {
  meta: {
    id: ID,
    name: "tool-description-unknown-placeholder",
    description:
      "Tool descriptions reference a {name} placeholder not present in the input schema",
    severity: "low",
    concern: "quality",
    rationale:
      "Placeholders in a description ({userId}, {path}) suggest the tool's " +
      "schema accepts that field. If the schema doesn't, the description " +
      "misleads the LLM and the user. This also catches stale descriptions " +
      "left behind after a rename.",
    examples: {
      bad:
        "export const schema = { id: z.string() };\n" +
        'export const metadata = { description: "Delete user {userId}" };',
      good:
        "export const schema = { userId: z.string() };\n" +
        'export const metadata = { description: "Delete user {userId}" };',
    },
  },
  check(ctx): Finding[] {
    const findings: Finding[] = [];
    for (const file of ctx.tools) {
      const metadata = findNamedExport(file.sourceFile, "metadata");
      if (!metadata || !ts.isObjectLiteralExpression(metadata)) continue;
      const descProp = findObjectProperty(metadata, "description");
      if (!descProp) continue;
      const description = getStringLiteralValue(descProp.initializer);
      if (!description) continue;

      const schemaNode = findNamedExport(file.sourceFile, "schema");
      const schemaKeys = collectSchemaKeys(schemaNode);

      const placeholders = new Set<string>();
      for (const match of description.matchAll(PLACEHOLDER)) {
        placeholders.add(match[1]);
      }
      const missing = [...placeholders].filter((name) => !schemaKeys.has(name));
      if (missing.length === 0) continue;

      const { line, column } = getLineColumn(
        file.sourceFile,
        descProp.getStart(file.sourceFile)
      );
      findings.push({
        ruleId: ID,
        severity: "low",
        concern: "quality",
        message: `Description references unknown placeholder(s): ${missing.map((m) => `{${m}}`).join(", ")}`,
        file: file.absolutePath,
        line,
        column,
        suggestion:
          "Rename the schema field to match or update the description to reference real inputs",
      });
    }
    return findings;
  },
};

function collectSchemaKeys(node: ts.Node | undefined): Set<string> {
  const keys = new Set<string>();
  if (!node || !ts.isObjectLiteralExpression(node)) return keys;
  for (const prop of node.properties) {
    if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
      keys.add(prop.name.text);
    } else if (ts.isShorthandPropertyAssignment(prop)) {
      keys.add(prop.name.text);
    }
  }
  return keys;
}

export default rule;
