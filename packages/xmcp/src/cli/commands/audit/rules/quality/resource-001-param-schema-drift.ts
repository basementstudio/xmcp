import path from "node:path";
import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import { findNamedExport } from "../../ast/visit";

const ID = "XMCP-RESOURCE-001";

const rule: Rule = {
  meta: {
    id: ID,
    name: "resource-param-schema-drift",
    description:
      "Resource path parameters should stay in sync with the exported schema keys",
    severity: "medium",
    concern: "quality",
    rationale:
      "xmcp resource templates derive URI variables from `[param]` path " +
      "segments. When those names drift from the exported schema keys, " +
      "runtime validation and resource URIs stop matching each other.",
    examples: {
      bad:
        "src/resources/(users)/[userId]/profile.ts\n" +
        "export const schema = { id: z.string() };",
      good:
        "src/resources/(users)/[userId]/profile.ts\n" +
        "export const schema = { userId: z.string() };",
    },
  },
  check(ctx): Finding[] {
    const findings: Finding[] = [];
    if (!ctx.resourcesDir) return findings;

    for (const file of ctx.resources) {
      const params = collectPathParams(
        path.relative(ctx.resourcesDir, file.absolutePath)
      );
      if (params.length === 0) continue;

      const schemaNode = findNamedExport(file.sourceFile, "schema");
      const schemaKeys = collectSchemaKeys(schemaNode);
      const missing = params.filter((param) => !schemaKeys.has(param));
      const extra = [...schemaKeys].filter((key) => !params.includes(key));
      if (missing.length === 0 && extra.length === 0) continue;

      const target = schemaNode ?? file.sourceFile;
      const { line, column } = getLineColumn(
        file.sourceFile,
        target.getStart(file.sourceFile)
      );
      findings.push({
        ruleId: ID,
        severity: "medium",
        concern: "quality",
        message: [
          missing.length > 0
            ? `missing schema keys for path params: ${missing.join(", ")}`
            : null,
          extra.length > 0
            ? `schema contains non-path keys: ${extra.join(", ")}`
            : null,
        ]
          .filter(Boolean)
          .join("; "),
        file: file.absolutePath,
        line,
        column,
        suggestion:
          "Align `[param]` path segments with exported resource schema keys",
      });
    }

    return findings;
  },
};

function collectPathParams(relativePath: string): string[] {
  return [...relativePath.matchAll(/\[([^\]]+)\]/g)].map((match) => match[1]);
}

function collectSchemaKeys(node: ts.Node | undefined): Set<string> {
  const keys = new Set<string>();
  if (!node || !ts.isObjectLiteralExpression(node)) return keys;
  for (const prop of node.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    if (ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name)) {
      keys.add(prop.name.text);
    }
  }
  return keys;
}

export default rule;
