import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import {
  getConfigObject,
  getStringOrBooleanLiteral,
} from "../../ast/config-parser";
import { findObjectProperty, walk } from "../../ast/visit";

const ID = "XMCP-CONFIG-002";

const AUTH_IDENTIFIERS = new Set(["apiKeyAuthMiddleware", "jwtAuthMiddleware"]);

const rule: Rule = {
  meta: {
    id: ID,
    name: "http-transport-without-auth-middleware",
    description:
      "HTTP transport enabled without any built-in auth middleware imported",
    severity: "high",
    concern: "security",
    rationale:
      "If http is true in xmcp.config and nothing under src/ imports an " +
      "auth middleware, the server exposes tools anonymously. This is rare " +
      "enough to flag high severity — use --disable-rule when auth lives " +
      "in a reverse proxy.",
    projectScope: true,
    examples: {
      bad: "http: true,  // + no auth middleware imported anywhere",
      good:
        'import { apiKeyAuthMiddleware } from "xmcp";\n' +
        "// or jwtAuthMiddleware",
    },
  },
  check(ctx): Finding[] {
    const info = getConfigObject(ctx.xmcpConfigFile);
    if (!info) return [];
    const httpProp = findObjectProperty(info.object, "http");
    if (!httpProp) return [];
    const value = getStringOrBooleanLiteral(httpProp.initializer);
    const httpEnabled =
      value === true || ts.isObjectLiteralExpression(httpProp.initializer);
    if (!httpEnabled) return [];

    const hasAuthImport = ctx.allSourceFiles.some((file) => {
      let found = false;
      walk(file.sourceFile, (node) => {
        if (found) return;
        if (ts.isImportDeclaration(node) && node.importClause?.namedBindings) {
          const bindings = node.importClause.namedBindings;
          if (ts.isNamedImports(bindings)) {
            for (const el of bindings.elements) {
              if (AUTH_IDENTIFIERS.has(el.name.text)) {
                found = true;
                return;
              }
            }
          }
        }
      });
      return found;
    });
    if (hasAuthImport) return [];

    const { line, column } = getLineColumn(
      info.sourceFile,
      httpProp.getStart(info.sourceFile)
    );
    return [
      {
        ruleId: ID,
        severity: "high",
        concern: "security",
        message:
          "HTTP transport is enabled but no xmcp auth middleware is imported in src/",
        file: ctx.xmcpConfigFile!.absolutePath,
        line,
        column,
        suggestion:
          'Import apiKeyAuthMiddleware or jwtAuthMiddleware from "xmcp", or disable this rule if auth is terminated upstream',
      },
    ];
  },
};

export default rule;
