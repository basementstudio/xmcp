import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import { getConfigObject } from "../../ast/config-parser";
import { findObjectProperty } from "../../ast/visit";
import ts from "typescript";

const ID = "XMCP-CONFIG-005";

const RECOMMENDED_FIELDS = ["name", "description", "instructions"];

const rule: Rule = {
  meta: {
    id: ID,
    name: "server-info-incomplete",
    description:
      "template block should declare name, description, and instructions",
    severity: "low",
    concern: "compliance",
    rationale:
      "MCP clients surface serverInfo to the user. A missing description " +
      "or instructions block leaves the client rendering a generic tile " +
      "and gives the model no framing for when to reach for the server.",
    projectScope: true,
    examples: {
      bad: 'template: { name: "My Server" }',
      good:
        "template: {\n" +
        '  name: "My Server",\n' +
        '  description: "Does X and Y",\n' +
        '  instructions: "Use this when you need to ...",\n' +
        "}",
    },
  },
  check(ctx): Finding[] {
    const info = getConfigObject(ctx.xmcpConfigFile);
    if (!info || !ctx.xmcpConfigFile) return [];
    const templateProp = findObjectProperty(info.object, "template");
    if (!templateProp) return [];
    if (!ts.isObjectLiteralExpression(templateProp.initializer)) return [];

    const missing = RECOMMENDED_FIELDS.filter(
      (field) =>
        !findObjectProperty(
          templateProp.initializer as ts.ObjectLiteralExpression,
          field
        )
    );
    if (missing.length === 0) return [];

    const { line, column } = getLineColumn(
      info.sourceFile,
      templateProp.getStart(info.sourceFile)
    );
    return [
      {
        ruleId: ID,
        severity: "low",
        concern: "compliance",
        message: `template is missing recommended fields: ${missing.join(", ")}`,
        file: ctx.xmcpConfigFile.absolutePath,
        line,
        column,
        suggestion:
          "Add the missing fields to help MCP clients identify the server",
      },
    ];
  },
};

export default rule;
