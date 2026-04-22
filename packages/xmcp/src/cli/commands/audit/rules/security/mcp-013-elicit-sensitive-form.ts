import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import { findHandlerFunction, getPropertyName, walk } from "../../ast/visit";

const ID = "XMCP-MCP-013";

const SENSITIVE_FIELD =
  /\b(api[-_ ]?key|access[-_ ]?token|refresh[-_ ]?token|bearer|secret|password|passcode|otp|credit[-_ ]?card|card number|cvv|oauth|authorization code)\b/i;

const rule: Rule = {
  meta: {
    id: ID,
    name: "sensitive-data-in-form-elicitation",
    description:
      "Form-mode elicitation should not request secrets or credentials",
    severity: "high",
    concern: "security",
    rationale:
      "MCP elicitation guidance reserves URL mode for auth, API keys, " +
      "payments, and other sensitive flows. Asking for credentials in form " +
      "mode exposes secrets to transports, logs, and generic UI surfaces.",
    heuristic: true,
    examples: {
      bad:
        "await extra.elicit({\n" +
        '  message: "Paste your API key",\n' +
        "  requestedSchema: { type: 'object', properties: { apiKey: { type: 'string' } } }\n" +
        "});",
      good:
        "await extra.elicit({\n" +
        "  mode: 'url',\n" +
        '  message: "Connect your account",\n' +
        '  url: "https://auth.example.com/connect",\n' +
        '  elicitationId: "oauth-connect"\n' +
        "});",
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
        if (!isFormMode(request)) return;

        const collected = collectSensitiveText(request);
        if (!SENSITIVE_FIELD.test(collected)) return;

        const { line, column } = getLineColumn(
          file.sourceFile,
          node.getStart(file.sourceFile)
        );
        findings.push({
          ruleId: ID,
          severity: "high",
          concern: "security",
          message:
            "Form-mode elicitation appears to request sensitive data; use URL mode instead",
          file: file.absolutePath,
          line,
          column,
          suggestion:
            'Move the flow to `mode: "url"` and keep credentials out of form fields',
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

function isFormMode(request: ts.ObjectLiteralExpression): boolean {
  const mode = findLiteralProp(request, "mode");
  return mode === null || mode === "form";
}

function collectSensitiveText(request: ts.ObjectLiteralExpression): string {
  const parts: string[] = [];
  for (const prop of request.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const key = getPropertyName(prop);
    if (key) parts.push(key);

    if (key === "message") {
      const value = getStaticString(prop.initializer);
      if (value) parts.push(value);
    }

    if (key === "schema" || key === "requestedSchema") {
      collectObjectStrings(prop.initializer, parts);
    }
  }
  return parts.join("\n");
}

function collectObjectStrings(node: ts.Node, out: string[]): void {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    out.push(node.text);
    return;
  }
  if (ts.isIdentifier(node)) {
    out.push(node.text);
    return;
  }
  if (ts.isObjectLiteralExpression(node)) {
    for (const prop of node.properties) {
      if (!ts.isPropertyAssignment(prop)) continue;
      const key = getPropertyName(prop);
      if (key) out.push(key);
      collectObjectStrings(prop.initializer, out);
    }
    return;
  }
  if (ts.isArrayLiteralExpression(node)) {
    for (const element of node.elements) collectObjectStrings(element, out);
  }
}

function findLiteralProp(
  obj: ts.ObjectLiteralExpression,
  name: string
): string | null {
  for (const prop of obj.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    if (getPropertyName(prop) !== name) continue;
    return getStaticString(prop.initializer);
  }
  return null;
}

function getStaticString(node: ts.Node): string | null {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  return null;
}

export default rule;
