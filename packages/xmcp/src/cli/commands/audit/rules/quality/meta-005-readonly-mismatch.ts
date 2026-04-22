import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import {
  findHandlerFunction,
  findNamedExport,
  findObjectProperty,
  getCalleeName,
  getPropertyName,
  walk,
} from "../../ast/visit";

const ID = "XMCP-META-005";

const FS_WRITE_METHODS = new Set([
  "appendFile",
  "appendFileSync",
  "chmod",
  "chown",
  "cp",
  "createWriteStream",
  "mkdir",
  "rename",
  "rm",
  "rmdir",
  "truncate",
  "unlink",
  "writeFile",
  "writeFileSync",
]);

const CHILD_PROCESS = new Set(["exec", "execFile", "spawn", "fork"]);
const WRITE_HTTP_METHOD = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const rule: Rule = {
  meta: {
    id: ID,
    name: "readonly-hint-mismatch",
    description:
      "Tools marked readOnlyHint should not perform obvious state-changing work",
    severity: "medium",
    concern: "quality",
    rationale:
      "Clients use readOnlyHint to decide whether a tool is safe to auto-run. " +
      "Marking a mutating tool as read-only is misleading and can bypass " +
      "user expectations around side effects.",
    heuristic: true,
    examples: {
      bad:
        "annotations: { readOnlyHint: true }\n" +
        "await fetch(url, { method: 'POST' });",
      good:
        "annotations: { readOnlyHint: false }\n" +
        "await fetch(url, { method: 'POST' });",
    },
  },
  check(ctx): Finding[] {
    const findings: Finding[] = [];
    for (const file of ctx.tools) {
      const metadata = findNamedExport(file.sourceFile, "metadata");
      if (!metadata || !ts.isObjectLiteralExpression(metadata)) continue;
      if (!hasReadOnlyTrue(metadata)) continue;

      const handler = findHandlerFunction(file.sourceFile);
      if (!handler) continue;
      const offending = findMutationSite(handler);
      if (!offending) continue;

      const { line, column } = getLineColumn(
        file.sourceFile,
        offending.getStart(file.sourceFile)
      );
      findings.push({
        ruleId: ID,
        severity: "medium",
        concern: "quality",
        message:
          "Tool is marked readOnlyHint: true but the handler performs obvious side effects",
        file: file.absolutePath,
        line,
        column,
        suggestion:
          "Remove `readOnlyHint: true` or change the handler to a read-only operation",
      });
    }
    return findings;
  },
};

function hasReadOnlyTrue(metadata: ts.ObjectLiteralExpression): boolean {
  const annotations = findObjectProperty(metadata, "annotations");
  if (!annotations || !ts.isObjectLiteralExpression(annotations.initializer)) {
    return false;
  }
  const readOnlyHint = findObjectProperty(
    annotations.initializer,
    "readOnlyHint"
  );
  return readOnlyHint?.initializer.kind === ts.SyntaxKind.TrueKeyword;
}

function findMutationSite(fn: ts.FunctionLikeDeclaration): ts.Node | null {
  let found: ts.Node | null = null;
  walk(fn, (node) => {
    if (found || !ts.isCallExpression(node)) return;
    const name = getCalleeName(node);
    if (!name) return;
    if (FS_WRITE_METHODS.has(name) || CHILD_PROCESS.has(name)) {
      found = node;
      return;
    }
    if (isWriteFetch(node) || isWriteStyleClient(node)) {
      found = node;
    }
  });
  return found;
}

function isWriteFetch(node: ts.CallExpression): boolean {
  if (getCalleeName(node) !== "fetch") return false;
  const options = node.arguments[1];
  return hasWriteHttpMethod(options);
}

function isWriteStyleClient(node: ts.CallExpression): boolean {
  if (!ts.isPropertyAccessExpression(node.expression)) return false;
  const method = node.expression.name.text;
  return WRITE_HTTP_METHOD.has(method.toUpperCase());
}

function hasWriteHttpMethod(node: ts.Node | undefined): boolean {
  if (!node || !ts.isObjectLiteralExpression(node)) return false;
  for (const prop of node.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    if (getPropertyName(prop) !== "method") continue;
    if (
      (ts.isStringLiteral(prop.initializer) ||
        ts.isNoSubstitutionTemplateLiteral(prop.initializer)) &&
      WRITE_HTTP_METHOD.has(prop.initializer.text.toUpperCase())
    ) {
      return true;
    }
  }
  return false;
}

export default rule;
