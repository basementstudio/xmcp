import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import { walk } from "../../ast/visit";

const ID = "XMCP-MCP-009";

const TARGET_EXPORTS = new Set(["metadata", "schema"]);

const RUG_OBJECT_METHODS = new Set([
  "assign",
  "defineProperty",
  "defineProperties",
  "setPrototypeOf",
]);

const rule: Rule = {
  meta: {
    id: ID,
    name: "tool-metadata-mutated",
    description:
      "Tool metadata and schema exports must not be reassigned or mutated after declaration",
    severity: "medium",
    concern: "security",
    rationale:
      "A client approves a tool by inspecting its declared metadata/schema. " +
      "Mutating those objects at load time (or later) lets the server drift " +
      "from what the client authorized — the rug-pull class documented in " +
      "safe-mcp SAFE-T1201 and Acuvity's MCP threat guide.",
    examples: {
      bad:
        'export const metadata = { name: "do_thing", description: "..." };\n' +
        "metadata.description = `${metadata.description} (build ${Date.now()})`;",
      good:
        "export const metadata = {\n" +
        '  name: "do_thing",\n' +
        '  description: "Does the thing",\n' +
        "};",
    },
  },
  check(ctx): Finding[] {
    const findings: Finding[] = [];
    for (const file of ctx.tools) {
      walk(file.sourceFile, (node) => {
        const mutation = detectMutation(node);
        if (!mutation) return;
        const { line, column } = getLineColumn(
          file.sourceFile,
          node.getStart(file.sourceFile)
        );
        findings.push({
          ruleId: ID,
          severity: "medium",
          concern: "security",
          message: `${mutation.target} is mutated after declaration (${mutation.how}) — rug-pull vector`,
          file: file.absolutePath,
          line,
          column,
          suggestion:
            "Define metadata and schema exactly once as a const literal. Compute any derived values into a local and inline them into the initializer — do not reassign afterwards.",
        });
      });
    }
    return findings;
  },
};

interface Mutation {
  target: string;
  how: string;
}

function detectMutation(node: ts.Node): Mutation | null {
  // Pattern A: metadata.X = ... / metadata[X] = ... / schema.X = ...
  if (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind === ts.SyntaxKind.EqualsToken
  ) {
    const target = rootTarget(node.left);
    if (target) return { target, how: "direct property assignment" };
  }

  // Pattern B: Object.assign(metadata, ...), Object.defineProperty(metadata, ...)
  if (ts.isCallExpression(node)) {
    const { expression } = node;
    if (
      ts.isPropertyAccessExpression(expression) &&
      ts.isIdentifier(expression.expression) &&
      expression.expression.text === "Object" &&
      RUG_OBJECT_METHODS.has(expression.name.text)
    ) {
      const firstArg = node.arguments[0];
      if (
        firstArg &&
        ts.isIdentifier(firstArg) &&
        TARGET_EXPORTS.has(firstArg.text)
      ) {
        return {
          target: firstArg.text,
          how: `Object.${expression.name.text}()`,
        };
      }
    }
  }
  return null;
}

// Walks a PropertyAccess or ElementAccess chain down to the root identifier.
// Returns the identifier text only when it matches a tracked export.
function rootTarget(node: ts.Node): string | null {
  let cursor: ts.Node = node;
  while (
    ts.isPropertyAccessExpression(cursor) ||
    ts.isElementAccessExpression(cursor)
  ) {
    cursor = cursor.expression;
  }
  if (ts.isIdentifier(cursor) && TARGET_EXPORTS.has(cursor.text)) {
    return cursor.text;
  }
  return null;
}

export default rule;
