import { jsonSchemaToZodCode } from "./json-schema-to-zod.js";

export type JsonObject = Record<string, unknown>;

export function object(value: unknown, location: string): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(`${location}: expected an object.`);
  return value as JsonObject;
}

/** Resolve local JSON Pointers only; never fetch or execute spec content. */
export function resolveObject(
  document: JsonObject,
  value: unknown,
  location: string,
  seen = new Set<string>()
): JsonObject {
  const input = object(value, location);
  if (!Object.hasOwn(input, "$ref")) return input;
  const ref = input.$ref;
  if (typeof ref !== "string" || !ref.startsWith("#/"))
    throw new Error(`${location}: only local #/ references are supported.`);
  if (seen.has(ref)) throw new Error(`${location}: circular reference ${ref}.`);
  for (const key of Object.keys(input))
    if (!["$ref", "description", "summary"].includes(key))
      throw new Error(`${location}: unsupported $ref sibling ${key}.`);
  let resolved: unknown = document;
  for (const key of decodeURIComponent(ref.slice(2))
    .split("/")
    .map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~"))) {
    const parent = object(resolved, `${location} (${ref})`);
    if (!Object.hasOwn(parent, key))
      throw new Error(`${location}: unresolved reference ${ref}.`);
    resolved = parent[key];
  }
  const result = resolveObject(
    document,
    resolved,
    location,
    new Set([...seen, ref])
  );
  return {
    ...result,
    ...(input.description === undefined
      ? {}
      : { description: input.description }),
  };
}

const ANNOTATIONS = new Set([
  "title",
  "description",
  "default",
  "example",
  "examples",
  "deprecated",
  "externalDocs",
]);

/** Restrict the converter's input so unsupported validation is never silently lost. */
export function parameterSchema(
  document: JsonObject,
  input: unknown,
  location: string,
  allowArray: boolean
): { code: string; array: boolean } {
  const schema = resolveObject(document, input, location);
  const type = schema.type;
  const numeric = type === "number" || type === "integer";
  const allowed = new Set(["type", "enum", ...ANNOTATIONS]);
  if (type === "string")
    ["minLength", "maxLength", "pattern"].forEach((key) => allowed.add(key));
  if (numeric)
    [
      "minimum",
      "maximum",
      "exclusiveMinimum",
      "exclusiveMaximum",
      "multipleOf",
      "format",
    ].forEach((key) => allowed.add(key));
  if (type === "array" && allowArray)
    ["items", "minItems", "maxItems"].forEach((key) => allowed.add(key));
  for (const key of Object.keys(schema))
    if (!allowed.has(key) && !key.startsWith("x-"))
      throw new Error(`${location}: unsupported schema keyword ${key}.`);
  if (
    !["string", "number", "integer", "boolean"].includes(String(type)) &&
    !(type === "array" && allowArray)
  )
    throw new Error(
      `${location}: expected a scalar schema${allowArray ? " or an array of scalars" : ""}.`
    );

  let code =
    type === "array"
      ? `z.array(${parameterSchema(document, schema.items, `${location}.items`, false).code})`
      : jsonSchemaToZodCode({ type });
  if (type === "integer") code += ".int()";
  if (schema.format !== undefined) {
    const formats =
      type === "integer" ? ["int32", "int64"] : ["float", "double"];
    if (!formats.includes(String(schema.format)))
      throw new Error(`${location}: unsupported format ${schema.format}.`);
    if (schema.format === "int32") code += ".min(-2147483648).max(2147483647)";
    // JavaScript numbers cannot exactly represent the entire OpenAPI int64 range.
    if (schema.format === "int64")
      code += ".min(Number.MIN_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER)";
  }
  for (const [keyword, method] of [
    ["minLength", "min"],
    ["maxLength", "max"],
    ["minItems", "min"],
    ["maxItems", "max"],
    ["multipleOf", "multipleOf"],
  ] as const) {
    const value = schema[keyword];
    if (value === undefined) continue;
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      (keyword === "multipleOf"
        ? value <= 0
        : !Number.isInteger(value) || value < 0)
    )
      throw new Error(`${location}: invalid ${keyword}.`);
    code += `.${method}(${value})`;
  }
  for (const [bound, exclusive, inclusiveMethod, exclusiveMethod] of [
    ["minimum", "exclusiveMinimum", "min", "gt"],
    ["maximum", "exclusiveMaximum", "max", "lt"],
  ] as const) {
    const value = schema[bound];
    const exclusion = schema[exclusive];
    if (value !== undefined) {
      if (typeof value !== "number" || !Number.isFinite(value))
        throw new Error(`${location}: invalid ${bound}.`);
      code += `.${exclusion === true ? exclusiveMethod : inclusiveMethod}(${value})`;
    }
    if (exclusion !== undefined) {
      if (String(document.openapi).startsWith("3.0.")) {
        if (
          typeof exclusion !== "boolean" ||
          (exclusion && value === undefined)
        )
          throw new Error(`${location}: invalid ${exclusive}.`);
      } else {
        if (typeof exclusion !== "number" || !Number.isFinite(exclusion))
          throw new Error(`${location}: invalid ${exclusive}.`);
        code += `.${exclusiveMethod}(${exclusion})`;
      }
    }
  }
  if (schema.pattern !== undefined) {
    if (typeof schema.pattern !== "string")
      throw new Error(`${location}: invalid pattern.`);
    try {
      new RegExp(schema.pattern);
    } catch {
      throw new Error(`${location}: invalid pattern.`);
    }
    code += `.regex(new RegExp(${JSON.stringify(schema.pattern)}))`;
  }
  if (schema.enum !== undefined) {
    const values = schema.enum;
    if (
      type === "array" ||
      !Array.isArray(values) ||
      !values.length ||
      values.some(
        (value) =>
          typeof value !== (numeric ? "number" : type) ||
          (typeof value === "number" && !Number.isFinite(value)) ||
          (type === "integer" && !Number.isInteger(value))
      )
    )
      throw new Error(
        `${location}: enum must contain values matching its scalar type.`
      );
    const literal =
      values.length === 1
        ? `z.literal(${JSON.stringify(values[0])})`
        : `z.union([${values.map((value) => `z.literal(${JSON.stringify(value)})`).join(", ")}])`;
    code += `.and(${literal})`;
  }
  if (schema.description !== undefined) {
    if (typeof schema.description !== "string")
      throw new Error(`${location}: description must be a string.`);
    code += `.describe(${JSON.stringify(schema.description)})`;
  }
  return { code, array: type === "array" };
}
