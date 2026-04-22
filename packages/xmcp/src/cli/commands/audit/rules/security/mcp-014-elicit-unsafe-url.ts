import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import { findHandlerFunction, getPropertyName, walk } from "../../ast/visit";

const ID = "XMCP-MCP-014";

const SECRET_PARAM = /(?:^|[?&#])(token|code|key|secret|password|auth)=/i;

const rule: Rule = {
  meta: {
    id: ID,
    name: "unsafe-url-elicitation",
    description:
      "URL-mode elicitation must use safe URLs without embedded credentials or secrets",
    severity: "high",
    concern: "security",
    rationale:
      "Sensitive elicitation URLs should be HTTPS in production and must " +
      "not embed credentials, auth codes, or tokens in the URL itself. " +
      "Those values leak through logs, history, and intermediaries.",
    heuristic: true,
    examples: {
      bad: "await extra.elicit({ mode: 'url', url: 'http://user:pass@example.com/cb?token=abc' });",
      good: "await extra.elicit({ mode: 'url', url: 'https://auth.example.com/connect', elicitationId: 'oauth-1' });",
    },
  },
  check(ctx): Finding[] {
    const findings: Finding[] = [];
    for (const file of ctx.tools) {
      const handler = findHandlerFunction(file.sourceFile);
      if (!handler) continue;

      walk(handler, (node) => {
        if (!ts.isCallExpression(node) || !isElicitCall(node)) return;
        const request = node.arguments[0];
        if (!request || !ts.isObjectLiteralExpression(request)) return;
        if (!isUrlMode(request)) return;

        const url = findLiteralProp(request, "url");
        if (!url) return;
        const problems = describeUnsafeUrl(url);
        if (problems.length === 0) return;

        const { line, column } = getLineColumn(
          file.sourceFile,
          node.getStart(file.sourceFile)
        );
        findings.push({
          ruleId: ID,
          severity: "high",
          concern: "security",
          message: `URL-mode elicitation uses an unsafe URL: ${problems.join(", ")}`,
          file: file.absolutePath,
          line,
          column,
          suggestion:
            "Use an HTTPS URL without embedded credentials or secret-bearing query parameters",
        });
      });
    }
    return findings;
  },
};

function isElicitCall(node: ts.CallExpression): boolean {
  const { expression } = node;
  return (
    ts.isPropertyAccessExpression(expression) &&
    expression.name.text === "elicit"
  );
}

function isUrlMode(request: ts.ObjectLiteralExpression): boolean {
  const mode = findLiteralProp(request, "mode");
  return mode === "url" || findLiteralProp(request, "url") !== null;
}

function findLiteralProp(
  obj: ts.ObjectLiteralExpression,
  name: string
): string | null {
  for (const prop of obj.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    if (getPropertyName(prop) !== name) continue;
    if (
      ts.isStringLiteral(prop.initializer) ||
      ts.isNoSubstitutionTemplateLiteral(prop.initializer)
    ) {
      return prop.initializer.text;
    }
  }
  return null;
}

function describeUnsafeUrl(url: string): string[] {
  const issues: string[] = [];
  let parsed: URL | null = null;
  try {
    parsed = new URL(url);
  } catch {
    return issues;
  }

  const isLocalhost =
    parsed.hostname === "localhost" ||
    parsed.hostname === "127.0.0.1" ||
    parsed.hostname === "::1";
  if (parsed.protocol !== "https:" && !isLocalhost) {
    issues.push("non-HTTPS URL");
  }
  if (parsed.username || parsed.password) {
    issues.push("embedded userinfo");
  }
  if (SECRET_PARAM.test(url)) {
    issues.push("secret-like query or fragment parameter");
  }

  return issues;
}

export default rule;
