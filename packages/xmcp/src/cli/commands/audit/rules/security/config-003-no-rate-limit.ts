import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import { getConfigObject } from "../../ast/config-parser";
import { findObjectProperty } from "../../ast/visit";

const ID = "XMCP-CONFIG-003";

const rule: Rule = {
  meta: {
    id: ID,
    name: "http-transport-without-rate-limit",
    description: "HTTP transport should declare a rateLimit policy",
    severity: "medium",
    concern: "security",
    rationale:
      "Without rate limiting a single authenticated caller can exhaust " +
      "the server or the LLM provider quota. A reasonable default belongs " +
      "in the config next to auth.",
    projectScope: true,
    examples: {
      bad: "http: { port: 3000 }",
      good:
        "http: {\n" +
        "  port: 3000,\n" +
        "  rateLimit: { windowMs: 60_000, max: 120 },\n" +
        "}",
    },
  },
  check(ctx): Finding[] {
    const info = getConfigObject(ctx.xmcpConfigFile);
    if (!info) return [];
    const httpProp = findObjectProperty(info.object, "http");
    if (!httpProp) return [];
    if (!ts.isObjectLiteralExpression(httpProp.initializer)) return [];
    const rateLimitProp = findObjectProperty(httpProp.initializer, "rateLimit");
    if (rateLimitProp) return [];

    const { line, column } = getLineColumn(
      info.sourceFile,
      httpProp.getStart(info.sourceFile)
    );
    return [
      {
        ruleId: ID,
        severity: "medium",
        concern: "security",
        message: "HTTP transport has no rateLimit configured",
        file: ctx.xmcpConfigFile!.absolutePath,
        line,
        column,
        suggestion: "Add a rateLimit block with sensible windowMs and max",
      },
    ];
  },
};

export default rule;
