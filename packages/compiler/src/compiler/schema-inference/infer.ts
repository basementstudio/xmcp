import ts from "typescript";

function documentation(symbol: ts.Symbol, checker: ts.TypeChecker): string {
  return ts.displayPartsToString(symbol.getDocumentationComment(checker));
}

export interface InferredTool {
  schema?: string;
  description?: string;
}

/** Infer only JSON-representable inputs; never widen an unsupported type to any. */
export function inferTool(
  source: ts.SourceFile,
  checker: ts.TypeChecker
): InferredTool {
  const module = checker.getSymbolAtLocation(source);
  const exports = module ? checker.getExportsOfModule(module) : [];
  const handler = exports.find((symbol) => symbol.name === "default");
  const explicitSchema = exports.some(
    (symbol) =>
      symbol.name === "schema" &&
      !!(
        (symbol.flags & ts.SymbolFlags.Alias
          ? checker.getAliasedSymbol(symbol)
          : symbol
        ).flags & ts.SymbolFlags.Value
      )
  );
  const fail = (node: ts.Node, field: string, reason: string): never => {
    const file = node.getSourceFile();
    const { line, character } = file.getLineAndCharacterOfPosition(
      node.getStart()
    );
    throw new Error(
      `${file.fileName}:${line + 1}:${character + 1}: Cannot infer tool ${source.fileName} (${field}): ${reason}. Export an explicit schema for this tool.`
    );
  };
  if (!handler) {
    if (explicitSchema) return {};
    return fail(source, "handler", "a default function export is required");
  }
  const resolved =
    handler.flags & ts.SymbolFlags.Alias
      ? checker.getAliasedSymbol(handler)
      : handler;
  const declaration =
    resolved.valueDeclaration ?? resolved.declarations?.[0] ?? source;
  const handlerType = checker.getTypeOfSymbolAtLocation(resolved, declaration);
  const signatures = handlerType.getCallSignatures();
  const description =
    documentation(resolved, checker) ||
    (signatures[0]
      ? ts.displayPartsToString(signatures[0].getDocumentationComment(checker))
      : "");
  const inferred: InferredTool = description ? { description } : {};
  // The presence of an export (even an empty schema) is an explicit override.
  if (explicitSchema) return inferred;
  if (signatures.length !== 1 || signatures[0].typeParameters?.length) {
    return fail(
      declaration,
      "handler",
      "expected one non-generic call signature"
    );
  }
  const signature = signatures[0];
  if (signature.parameters.length > 2) {
    return fail(
      declaration,
      "handler",
      "only input and request context parameters are supported"
    );
  }
  if (!signature.parameters.length) return { ...inferred, schema: "{}" };
  const parameter = signature.parameters[0];
  const parameterNode = parameter.valueDeclaration ?? declaration;
  if (ts.isParameter(parameterNode) && parameterNode.dotDotDotToken) {
    return fail(parameterNode, "input", "rest parameters are unsupported");
  }
  const input = checker.getTypeOfSymbolAtLocation(parameter, parameterNode);
  const active = new Set<ts.Type>();

  function objectShape(type: ts.Type, node: ts.Node, field: string): string {
    if (
      !(type.flags & ts.TypeFlags.Object) ||
      checker.isArrayType(type) ||
      checker.isTupleType(type) ||
      type.getCallSignatures().length ||
      type.getConstructSignatures().length ||
      (type.symbol?.flags ?? 0) & ts.SymbolFlags.Class ||
      type.symbol?.declarations?.some(
        (declaration) =>
          declaration.getSourceFile().hasNoDefaultLib &&
          ts.isInterfaceDeclaration(declaration)
      ) ||
      checker.getIndexInfosOfType(type).length
    ) {
      return fail(
        node,
        field,
        "expected an object with named JSON properties (no classes or index signatures)"
      );
    }
    // An unresolved interface base can otherwise disappear from getPropertiesOfType.
    for (const declaration of type.symbol?.declarations ?? []) {
      if (!ts.isInterfaceDeclaration(declaration)) continue;
      for (const clause of declaration.heritageClauses ?? []) {
        for (const base of clause.types) {
          if (!(checker.getTypeAtLocation(base).flags & ts.TypeFlags.Object)) {
            return fail(
              base,
              field,
              "unresolved or unsupported interface base"
            );
          }
        }
      }
    }
    const properties = checker.getPropertiesOfType(type).map((property) => {
      const propertyNode =
        property.valueDeclaration ?? property.declarations?.[0] ?? node;
      if (property.name.startsWith("__@")) {
        return fail(propertyNode, field, "symbol properties are unsupported");
      }
      const optional = !!(property.flags & ts.SymbolFlags.Optional);
      const propertyType = checker.getTypeOfSymbolAtLocation(
        property,
        propertyNode
      );
      let code = convert(
        propertyType,
        propertyNode,
        `${field}.${property.name}`,
        optional
      );
      if (optional) code += ".optional()";
      const description = documentation(property, checker);
      if (description) code += `.describe(${JSON.stringify(description)})`;
      return `[${JSON.stringify(property.name)}]: ${code}`;
    });
    return `{${properties.join(",\n")}}`;
  }

  function convert(
    type: ts.Type,
    node: ts.Node,
    field: string,
    optional = false
  ): string {
    if (active.has(type))
      return fail(node, field, "recursive types are unsupported");
    active.add(type);
    try {
      if (type.isUnion()) {
        const members = type.types.filter(
          (member) => !(optional && member.flags & ts.TypeFlags.Undefined)
        );
        const codes = members.map((member) => convert(member, node, field));
        if (codes.length === 1) return codes[0];
        if (codes.length > 1) return `z.union([${codes.join(", ")}])`;
      }
      if (type.flags & ts.TypeFlags.StringLiteral)
        return `z.literal(${JSON.stringify((type as ts.StringLiteralType).value)})`;
      if (type.flags & ts.TypeFlags.NumberLiteral)
        return `z.literal(${(type as ts.NumberLiteralType).value})`;
      if (type.flags & ts.TypeFlags.BooleanLiteral)
        return `z.literal(${checker.typeToString(type)})`;
      if (type.flags & ts.TypeFlags.String) return "z.string()";
      if (type.flags & ts.TypeFlags.Number) return "z.number()";
      if (type.flags & ts.TypeFlags.Boolean) return "z.boolean()";
      if (type.flags & ts.TypeFlags.Null) return "z.null()";
      if (checker.isArrayType(type)) {
        const [element] = checker.getTypeArguments(type as ts.TypeReference);
        return `z.array(${convert(element, node, `${field}[]`)})`;
      }
      if (type.flags & ts.TypeFlags.Object)
        return `z.object(${objectShape(type, node, field)})`;
      return fail(
        node,
        field,
        `unsupported type ${checker.typeToString(type)}`
      );
    } finally {
      active.delete(type);
    }
  }

  active.add(input);
  return { ...inferred, schema: objectShape(input, parameterNode, "input") };
}
