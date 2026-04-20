import ts from "typescript";

export function walk(node: ts.Node, visitor: (node: ts.Node) => void): void {
  visitor(node);
  ts.forEachChild(node, (child) => walk(child, visitor));
}

export function isZodCall(
  node: ts.Node,
  memberName: string
): node is ts.CallExpression {
  if (!ts.isCallExpression(node)) return false;
  const { expression } = node;
  if (!ts.isPropertyAccessExpression(expression)) return false;
  if (expression.name.text !== memberName) return false;

  // Match `z.<memberName>(...)` directly, or a chain that starts from `z`.
  let cursor: ts.Expression = expression.expression;
  while (ts.isCallExpression(cursor) || ts.isPropertyAccessExpression(cursor)) {
    cursor = ts.isCallExpression(cursor)
      ? cursor.expression
      : cursor.expression;
    if (ts.isIdentifier(cursor)) break;
  }
  return ts.isIdentifier(cursor) && cursor.text === "z";
}

export function findDefaultExport(
  sourceFile: ts.SourceFile
): ts.Node | undefined {
  for (const stmt of sourceFile.statements) {
    if (ts.isExportAssignment(stmt) && !stmt.isExportEquals) {
      return stmt.expression;
    }
    if (ts.isFunctionDeclaration(stmt) && stmt.modifiers) {
      const hasExport = stmt.modifiers.some(
        (m) => m.kind === ts.SyntaxKind.ExportKeyword
      );
      const hasDefault = stmt.modifiers.some(
        (m) => m.kind === ts.SyntaxKind.DefaultKeyword
      );
      if (hasExport && hasDefault) return stmt;
    }
  }
  return undefined;
}

export function findNamedExport(
  sourceFile: ts.SourceFile,
  name: string
): ts.Node | undefined {
  for (const stmt of sourceFile.statements) {
    if (ts.isVariableStatement(stmt)) {
      const hasExport = stmt.modifiers?.some(
        (m) => m.kind === ts.SyntaxKind.ExportKeyword
      );
      if (!hasExport) continue;
      for (const decl of stmt.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && decl.name.text === name) {
          return decl.initializer;
        }
      }
    }
  }
  return undefined;
}

/**
 * Collects identifier names bound by a parameter of a function. Defaults to
 * the first parameter (the tool input payload); pass paramIndex=1 to pick up
 * the second parameter (e.g. the `extra` object that carries authInfo).
 * Handles simple destructuring `({ name, other }) => {}` and plain `name => {}`.
 */
export function collectHandlerParamBindings(
  fn: ts.FunctionLikeDeclaration,
  paramIndex = 0
): Set<string> {
  const bindings = new Set<string>();
  const param = fn.parameters[paramIndex];
  if (!param) return bindings;

  const { name } = param;
  if (ts.isIdentifier(name)) {
    bindings.add(name.text);
    return bindings;
  }
  if (ts.isObjectBindingPattern(name)) {
    for (const element of name.elements) {
      if (ts.isIdentifier(element.name)) {
        bindings.add(element.name.text);
      }
    }
  }
  return bindings;
}

export function isDescendantOf(node: ts.Node, ancestor: ts.Node): boolean {
  let cursor: ts.Node | undefined = node;
  while (cursor) {
    if (cursor === ancestor) return true;
    cursor = cursor.parent;
  }
  return false;
}

/**
 * Returns the literal string value of a node if it is a string literal or a
 * no-substitution template literal. Returns null otherwise.
 */
export function getStringLiteralValue(node: ts.Node): string | null {
  if (ts.isStringLiteral(node)) return node.text;
  if (ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  return null;
}

export function findObjectProperty(
  obj: ts.ObjectLiteralExpression,
  name: string
): ts.PropertyAssignment | undefined {
  for (const prop of obj.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const key = getPropertyName(prop);
    if (key === name) return prop;
  }
  return undefined;
}

export function getPropertyName(
  prop: ts.PropertyAssignment | ts.ShorthandPropertyAssignment
): string | null {
  const { name } = prop;
  if (ts.isIdentifier(name)) return name.text;
  if (ts.isStringLiteral(name)) return name.text;
  return null;
}

/**
 * Walks a zod chain like `z.string().min(1).describe("...")` and returns the
 * set of method names present. The base call (e.g. `z.string()`) is included.
 */
export function collectZodChainMethods(node: ts.Node): Set<string> {
  const methods = new Set<string>();
  let cursor: ts.Node = node;
  while (
    ts.isCallExpression(cursor) &&
    ts.isPropertyAccessExpression(cursor.expression)
  ) {
    methods.add(cursor.expression.name.text);
    cursor = cursor.expression.expression;
  }
  // Base: `z.string()` — the `string` ident is the last PropertyAccess before `z`.
  if (
    ts.isCallExpression(cursor) &&
    ts.isPropertyAccessExpression(cursor.expression)
  ) {
    methods.add(cursor.expression.name.text);
  } else if (ts.isPropertyAccessExpression(cursor)) {
    methods.add(cursor.name.text);
  }
  return methods;
}

/**
 * True if any descendant identifier in `node` matches a name in `bindings`.
 * Used to check whether an expression traces back to a handler parameter.
 */
export function referencesBinding(
  node: ts.Node,
  bindings: Set<string>
): boolean {
  let found = false;
  walk(node, (n) => {
    if (!found && ts.isIdentifier(n) && bindings.has(n.text)) {
      found = true;
    }
  });
  return found;
}

export function findHandlerFunction(
  sourceFile: ts.SourceFile
): ts.FunctionLikeDeclaration | null {
  for (const stmt of sourceFile.statements) {
    if (
      ts.isFunctionDeclaration(stmt) &&
      stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)
    ) {
      return stmt;
    }
    if (ts.isExportAssignment(stmt) && !stmt.isExportEquals) {
      const expr = stmt.expression;
      if (ts.isArrowFunction(expr) || ts.isFunctionExpression(expr)) {
        return expr;
      }
    }
  }
  return null;
}

export function getCalleeName(node: ts.CallExpression): string | null {
  const { expression } = node;
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) return expression.name.text;
  return null;
}

export function getCalleeObject(node: ts.CallExpression): string | null {
  const { expression } = node;
  if (!ts.isPropertyAccessExpression(expression)) return null;
  const obj = expression.expression;
  if (ts.isIdentifier(obj)) return obj.text;
  return null;
}
