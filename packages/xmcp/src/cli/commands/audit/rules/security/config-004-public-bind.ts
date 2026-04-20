import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import {
  getConfigObject,
  getStringOrBooleanLiteral,
} from "../../ast/config-parser";
import { findObjectProperty } from "../../ast/visit";

const ID = "XMCP-CONFIG-004";

const rule: Rule = {
  meta: {
    id: ID,
    name: "http-public-bind",
    description: 'http.host "0.0.0.0" should be env-gated, not hardcoded',
    severity: "low",
    concern: "security",
    rationale:
      "A hardcoded 0.0.0.0 bind means the server listens on every " +
      "interface in every environment — including laptops on a public " +
      "network. Gate it on an environment variable instead.",
    projectScope: true,
    examples: {
      bad: 'http: { host: "0.0.0.0" }',
      good: 'http: { host: process.env.HOST ?? "127.0.0.1" }',
    },
  },
  check(ctx): Finding[] {
    const info = getConfigObject(ctx.xmcpConfigFile);
    if (!info) return [];
    const httpProp = findObjectProperty(info.object, "http");
    if (!httpProp) return [];
    if (!ts.isObjectLiteralExpression(httpProp.initializer)) return [];
    const hostProp = findObjectProperty(httpProp.initializer, "host");
    if (!hostProp) return [];
    const host = getStringOrBooleanLiteral(hostProp.initializer);
    if (host !== "0.0.0.0") return [];

    const { line, column } = getLineColumn(
      info.sourceFile,
      hostProp.getStart(info.sourceFile)
    );
    return [
      {
        ruleId: ID,
        severity: "low",
        concern: "security",
        message: 'http.host is hardcoded to "0.0.0.0"',
        file: ctx.xmcpConfigFile!.absolutePath,
        line,
        column,
        suggestion:
          "Read the bind host from an environment variable, defaulting to 127.0.0.1",
      },
    ];
  },
};

export default rule;
