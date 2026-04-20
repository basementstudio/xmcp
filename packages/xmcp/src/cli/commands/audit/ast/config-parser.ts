import ts from "typescript";
import type { ParsedFile } from "../types";
import { findObjectProperty, getPropertyName } from "./visit";

export interface ConfigObjectInfo {
  object: ts.ObjectLiteralExpression;
  sourceFile: ts.SourceFile;
}

/**
 * Locates the default-exported configuration object in xmcp.config.ts.
 * Supports both `export default { ... }` and `const x = { ... }; export default x;`.
 */
export function getConfigObject(
  configFile: ParsedFile | null
): ConfigObjectInfo | null {
  if (!configFile) return null;
  const { sourceFile } = configFile;

  let defaultExpr: ts.Expression | null = null;
  for (const stmt of sourceFile.statements) {
    if (ts.isExportAssignment(stmt) && !stmt.isExportEquals) {
      defaultExpr = stmt.expression;
      break;
    }
  }
  if (!defaultExpr) return null;

  if (ts.isObjectLiteralExpression(defaultExpr)) {
    return { object: defaultExpr, sourceFile };
  }

  if (ts.isIdentifier(defaultExpr)) {
    const targetName = defaultExpr.text;
    for (const stmt of sourceFile.statements) {
      if (!ts.isVariableStatement(stmt)) continue;
      for (const decl of stmt.declarationList.declarations) {
        if (
          ts.isIdentifier(decl.name) &&
          decl.name.text === targetName &&
          decl.initializer &&
          ts.isObjectLiteralExpression(decl.initializer)
        ) {
          return { object: decl.initializer, sourceFile };
        }
      }
    }
  }
  return null;
}

export function getConfigProperty(
  info: ConfigObjectInfo,
  name: string
): ts.PropertyAssignment | undefined {
  return findObjectProperty(info.object, name);
}

/**
 * Convenience: navigates `config.a.b.c` when each segment is an object literal
 * property with an object literal initializer. Returns the terminal property
 * assignment or null if the path is not literal-resolvable.
 */
export function resolveConfigPath(
  info: ConfigObjectInfo,
  pathSegments: string[]
): ts.PropertyAssignment | null {
  let current: ts.ObjectLiteralExpression = info.object;
  let last: ts.PropertyAssignment | null = null;
  for (let i = 0; i < pathSegments.length; i++) {
    const segment = pathSegments[i];
    const prop = findObjectProperty(current, segment);
    if (!prop) return null;
    last = prop;
    if (i === pathSegments.length - 1) break;
    if (!ts.isObjectLiteralExpression(prop.initializer)) return null;
    current = prop.initializer;
  }
  return last;
}

export function getStringOrBooleanLiteral(
  node: ts.Node
): string | boolean | null {
  if (ts.isStringLiteral(node)) return node.text;
  if (ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  return null;
}

export { getPropertyName };
