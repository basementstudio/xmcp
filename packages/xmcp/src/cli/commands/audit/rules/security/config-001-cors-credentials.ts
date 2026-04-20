import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import {
  getConfigObject,
  getStringOrBooleanLiteral,
  resolveConfigPath,
} from "../../ast/config-parser";
import { findObjectProperty } from "../../ast/visit";

const ID = "XMCP-CONFIG-001";

const rule: Rule = {
  meta: {
    id: ID,
    name: "cors-wildcard-with-credentials",
    description:
      'http.cors.origin "*" combined with credentials: true is unsafe and rejected by browsers',
    severity: "high",
    concern: "security",
    rationale:
      "Browsers reject this combination. Beyond that, it advertises that " +
      "the server is willing to echo credentials to any origin — a loud " +
      "misconfiguration.",
    projectScope: true,
    examples: {
      bad: 'http: { cors: { origin: "*", credentials: true } }',
      good: 'http: { cors: { origin: ["https://app.example.com"], credentials: true } }',
    },
  },
  check(ctx): Finding[] {
    const info = getConfigObject(ctx.xmcpConfigFile);
    if (!info) return [];
    const corsProp = resolveConfigPath(info, ["http", "cors"]);
    if (!corsProp) return [];
    if (!ts.isObjectLiteralExpression(corsProp.initializer)) return [];

    const originProp = findObjectProperty(corsProp.initializer, "origin");
    const credsProp = findObjectProperty(corsProp.initializer, "credentials");
    if (!originProp || !credsProp) return [];
    const origin = getStringOrBooleanLiteral(originProp.initializer);
    const credentials = getStringOrBooleanLiteral(credsProp.initializer);
    if (origin !== "*" || credentials !== true) return [];

    const { line, column } = getLineColumn(
      info.sourceFile,
      corsProp.getStart(info.sourceFile)
    );
    return [
      {
        ruleId: ID,
        severity: "high",
        concern: "security",
        message: 'cors.origin: "*" combined with credentials: true',
        file: ctx.xmcpConfigFile!.absolutePath,
        line,
        column,
        suggestion: "Replace origin with an explicit list of trusted origins",
      },
    ];
  },
};

export default rule;
