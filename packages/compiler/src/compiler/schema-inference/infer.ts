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
  const constraintKinds = {
    minimum: "number",
    maximum: "number",
    minLength: "string",
    maxLength: "string",
    pattern: "string",
    format: "string",
  } as const;
  type ConstraintTag = keyof typeof constraintKinds;
  const isConstraintTag = (name: string): name is ConstraintTag =>
    Object.prototype.hasOwnProperty.call(constraintKinds, name);

  for (const tag of resolved.getJsDocTags(checker)) {
    if (isConstraintTag(tag.name))
      fail(declaration, "handler", `@${tag.name} belongs on an input property`);
  }

  if (!signature.parameters.length) return { ...inferred, schema: "{}" };
  const parameter = signature.parameters[0];
  const parameterNode = parameter.valueDeclaration ?? declaration;
  if (ts.isParameter(parameterNode) && parameterNode.dotDotDotToken) {
    return fail(parameterNode, "input", "rest parameters are unsupported");
  }
  const input = checker.getTypeOfSymbolAtLocation(parameter, parameterNode);
  const active = new Set<ts.Type>();

  function constraints(
    property: ts.Symbol,
    type: ts.Type,
    node: ts.Node,
    field: string,
    optional: boolean
  ): string {
    const values = new Map<ConstraintTag, string>();
    for (const tag of property.getJsDocTags(checker)) {
      if (!isConstraintTag(tag.name)) continue;
      if (values.has(tag.name)) fail(node, field, `duplicate @${tag.name}`);
      const value = ts.displayPartsToString(tag.text).trim();
      if (!value) fail(node, field, `@${tag.name} requires a value`);
      const members = (type.isUnion() ? type.types : [type]).filter(
        (member) =>
          !(member.flags & ts.TypeFlags.Null) &&
          !(optional && member.flags & ts.TypeFlags.Undefined)
      );
      const flag =
        constraintKinds[tag.name] === "number"
          ? ts.TypeFlags.Number
          : ts.TypeFlags.String;
      if (
        !members.length ||
        !members.every((member) => !!(member.flags & flag))
      )
        fail(
          node,
          field,
          `@${tag.name} requires a ${constraintKinds[tag.name]} property (optionally nullable or optional)`
        );
      values.set(tag.name, value);
    }
    let code = "";
    const bounds = new Map<ConstraintTag, number>();
    for (const [tag, value] of values) {
      if (tag === "pattern") {
        try {
          new RegExp(value);
        } catch {
          fail(
            node,
            field,
            "@pattern must be a valid regular expression source"
          );
        }
        code += `.regex(new RegExp(${JSON.stringify(value)}))`;
      } else if (tag === "format") {
        const methods: Record<string, string> = {
          email: "email",
          uri: "url",
          uuid: "uuid",
        };
        if (!Object.prototype.hasOwnProperty.call(methods, value))
          fail(node, field, "@format must be email, uri, or uuid");
        code += `.${methods[value]}()`;
      } else {
        const number = Number(value);
        if (
          !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value) ||
          !Number.isFinite(number)
        )
          fail(node, field, `@${tag} requires a finite number`);
        if (
          (tag === "minLength" || tag === "maxLength") &&
          (!Number.isSafeInteger(number) || number < 0)
        )
          fail(node, field, `@${tag} requires a nonnegative safe integer`);
        bounds.set(tag, number);
        code += `.${tag === "minimum" || tag === "minLength" ? "min" : "max"}(${number})`;
      }
    }
    for (const [min, max] of [
      ["minimum", "maximum"],
      ["minLength", "maxLength"],
    ] as const) {
      if (
        bounds.has(min) &&
        bounds.has(max) &&
        bounds.get(min)! > bounds.get(max)!
      )
        fail(node, field, `@${min} must not exceed @${max}`);
    }
    return code;
  }

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
        optional,
        constraints(
          property,
          propertyType,
          propertyNode,
          `${field}.${property.name}`,
          optional
        )
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
    optional = false,
    constraintCode = ""
  ): string {
    if (active.has(type))
      return fail(node, field, "recursive types are unsupported");
    active.add(type);
    try {
      if (type.flags & ts.TypeFlags.Boolean) return "z.boolean()";
      if (type.isUnion()) {
        const members = type.types.filter(
          (member) => !(optional && member.flags & ts.TypeFlags.Undefined)
        );
        const strings = members.filter(
          (member): member is ts.StringLiteralType =>
            !!(member.flags & ts.TypeFlags.StringLiteral)
        );
        const booleans = members.filter(
          (member) => !!(member.flags & ts.TypeFlags.BooleanLiteral)
        );
        const codes: string[] = [];
        if (strings.length > 1)
          codes.push(
            `z.enum(${JSON.stringify(strings.map((member) => member.value))})`
          );
        if (booleans.length === 2) codes.push("z.boolean()");
        for (const member of members) {
          if (strings.length > 1 && member.flags & ts.TypeFlags.StringLiteral)
            continue;
          if (
            booleans.length === 2 &&
            member.flags & ts.TypeFlags.BooleanLiteral
          )
            continue;
          codes.push(convert(member, node, field, false, constraintCode));
        }
        if (codes.length === 1) return codes[0];
        if (codes.length > 1) return `z.union([${codes.join(", ")}])`;
      }
      if (type.flags & ts.TypeFlags.StringLiteral)
        return `z.literal(${JSON.stringify((type as ts.StringLiteralType).value)})`;
      if (type.flags & ts.TypeFlags.NumberLiteral)
        return `z.literal(${(type as ts.NumberLiteralType).value})`;
      if (type.flags & ts.TypeFlags.BooleanLiteral)
        return `z.literal(${checker.typeToString(type)})`;
      if (type.flags & ts.TypeFlags.String)
        return `z.string()${constraintCode}`;
      if (type.flags & ts.TypeFlags.Number)
        return `z.number()${constraintCode}`;
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
