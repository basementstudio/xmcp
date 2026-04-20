import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import { findNamedExport, getPropertyName } from "../../ast/visit";

const ID = "XMCP-MCP-008";

const rule: Rule = {
  meta: {
    id: ID,
    name: "dynamic-tool-metadata",
    description:
      "Tool metadata and schema exports must be static literals, not runtime-computed",
    severity: "high",
    concern: "security",
    rationale:
      "When a client approves an xmcp tool it inspects declared metadata " +
      "and schema. Computing those exports from env vars, file reads, " +
      "network responses, or conditional branches lets the tool's identity " +
      "shift between approval and invocation — the rug-pull class called " +
      "out by safe-mcp SAFE-T1201 and arXiv 2506.01333 (ETDI).",
    examples: {
      bad:
        "export const metadata = {\n" +
        "  name: `tool_${process.env.VARIANT}`,\n" +
        "  description: fetchDescription(),\n" +
        "};",
      good:
        "export const metadata = {\n" +
        '  name: "tool_primary",\n' +
        '  description: "Does the primary thing",\n' +
        "};",
    },
    heuristic: true,
  },
  check(ctx): Finding[] {
    const findings: Finding[] = [];
    for (const file of ctx.tools) {
      for (const exportName of ["metadata", "schema"] as const) {
        const exportNode = findNamedExport(file.sourceFile, exportName);
        if (!exportNode) continue;

        if (!ts.isObjectLiteralExpression(exportNode)) {
          const { line, column } = getLineColumn(
            file.sourceFile,
            exportNode.getStart(file.sourceFile)
          );
          findings.push({
            ruleId: ID,
            severity: "high",
            concern: "security",
            message: `export \`${exportName}\` is not a direct object literal — runtime-computed values can drift between approval and invocation`,
            file: file.absolutePath,
            line,
            column,
            suggestion:
              "Declare metadata and schema as inline object literals with static values only.",
          });
          continue;
        }

        // For `metadata`, check every property value is a static literal.
        // For `schema`, the values are zod call expressions by convention —
        // flagging every call would be too noisy, so we accept the top-level
        // literal and rely on the export-shape check above.
        if (exportName === "metadata") {
          collectMetadataDynamics(
            exportNode,
            file.absolutePath,
            file.sourceFile,
            findings
          );
        }
      }
    }
    return findings;
  },
};

function collectMetadataDynamics(
  obj: ts.ObjectLiteralExpression,
  filePath: string,
  sourceFile: ts.SourceFile,
  findings: Finding[],
  path: string[] = []
): void {
  for (const prop of obj.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const key = getPropertyName(prop);
    if (!key) continue;
    const nextPath = [...path, key];

    if (
      ts.isObjectLiteralExpression(prop.initializer) &&
      key === "annotations"
    ) {
      collectMetadataDynamics(
        prop.initializer,
        filePath,
        sourceFile,
        findings,
        nextPath
      );
      continue;
    }

    if (isStaticMetadataValue(prop.initializer)) continue;

    const { line, column } = getLineColumn(
      sourceFile,
      prop.getStart(sourceFile)
    );
    findings.push({
      ruleId: ID,
      severity: "high",
      concern: "security",
      message: `metadata.${nextPath.join(".")} is not a static literal — the value can drift between approval and invocation`,
      file: filePath,
      line,
      column,
      suggestion:
        "Inline a literal value. If the value must vary per environment, expose separate tools rather than one tool with shape-shifting metadata.",
    });
  }
}

function isStaticMetadataValue(node: ts.Node): boolean {
  if (ts.isStringLiteral(node)) return true;
  if (ts.isNumericLiteral(node)) return true;
  if (ts.isNoSubstitutionTemplateLiteral(node)) return true;
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return true;
  if (node.kind === ts.SyntaxKind.NullKeyword) return true;
  if (
    ts.isPrefixUnaryExpression(node) &&
    node.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(node.operand)
  ) {
    return true;
  }
  if (ts.isObjectLiteralExpression(node)) {
    return node.properties.every(
      (p) => ts.isPropertyAssignment(p) && isStaticMetadataValue(p.initializer)
    );
  }
  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.every(isStaticMetadataValue);
  }
  return false;
}

export default rule;
