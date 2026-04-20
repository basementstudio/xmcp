import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import {
  findNamedExport,
  findObjectProperty,
  getStringLiteralValue,
} from "../../ast/visit";

const ID = "XMCP-META-001";

const DESTRUCTIVE_VERBS =
  /\b(delete|remove|drop|destroy|truncate|overwrite|purge|wipe|erase)\b/i;

const rule: Rule = {
  meta: {
    id: ID,
    name: "destructive-tool-missing-hint",
    description:
      "Tools whose name or description implies destruction must set destructiveHint",
    severity: "medium",
    concern: "quality",
    rationale:
      "MCP clients (including Claude) gate auto-approval on " +
      "`annotations.destructiveHint`. A delete-style tool without the hint " +
      "is effectively whitelisted for unattended calls.",
    examples: {
      bad: 'export const metadata = { name: "delete_user", description: "Delete a user" };',
      good:
        "export const metadata = {\n" +
        '  name: "delete_user",\n' +
        '  description: "Delete a user",\n' +
        "  annotations: { destructiveHint: true },\n" +
        "};",
    },
  },
  check(ctx): Finding[] {
    const findings: Finding[] = [];
    for (const file of ctx.tools) {
      const meta = findNamedExport(file.sourceFile, "metadata");
      if (!meta || !ts.isObjectLiteralExpression(meta)) continue;

      const nameProp = findObjectProperty(meta, "name");
      const descProp = findObjectProperty(meta, "description");
      const name = nameProp
        ? (getStringLiteralValue(nameProp.initializer) ?? "")
        : "";
      const description = descProp
        ? (getStringLiteralValue(descProp.initializer) ?? "")
        : "";
      const indicatesDestructive =
        DESTRUCTIVE_VERBS.test(name) || DESTRUCTIVE_VERBS.test(description);
      if (!indicatesDestructive) continue;

      const annotations = findObjectProperty(meta, "annotations");
      const hint =
        annotations && ts.isObjectLiteralExpression(annotations.initializer)
          ? findObjectProperty(annotations.initializer, "destructiveHint")
          : undefined;
      const isSetTrue =
        hint && hint.initializer.kind === ts.SyntaxKind.TrueKeyword;
      if (isSetTrue) continue;

      const { line, column } = getLineColumn(
        file.sourceFile,
        meta.getStart(file.sourceFile)
      );
      findings.push({
        ruleId: ID,
        severity: "medium",
        concern: "quality",
        message:
          "Tool appears destructive but metadata.annotations.destructiveHint is not set to true",
        file: file.absolutePath,
        line,
        column,
        suggestion: "Add annotations: { destructiveHint: true } to metadata",
      });
    }
    return findings;
  },
};

export default rule;
