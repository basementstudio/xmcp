/**
 * Converts JSON Schema to Zod code strings at build time.
 * This generates actual Zod code that TypeScript can statically analyze
 * and infer types from, unlike runtime conversion approaches.
 */

/**
 * Converts a JSON schema property to a Zod code string.
 */
export function jsonSchemaToZodCode(
  schema: unknown,
  isRequired: boolean = true
): string {
  if (!schema || typeof schema !== "object") {
    return isRequired ? "z.any()" : "z.any().optional()";
  }

  const s = schema as Record<string, unknown>;
  let zodCode: string;

  if (Array.isArray(s.enum) && s.enum.length > 0) {
    const enumValues = (s.enum as string[])
      .map((v) => JSON.stringify(v))
      .join(", ");
    zodCode = `z.enum([${enumValues}])`;
  } else {
    switch (s.type) {
      case "string":
        zodCode = "z.string()";
        break;
      case "number":
      case "integer":
        zodCode = "z.number()";
        break;
      case "boolean":
        zodCode = "z.boolean()";
        break;
      case "array":
        zodCode = `z.array(${jsonSchemaToZodCode(s.items ?? {}, true)})`;
        break;
      case "object":
        zodCode = jsonSchemaToZodObjectCode(s);
        break;
      default:
        zodCode = "z.any()";
    }
  }

  if (typeof s.description === "string") {
    zodCode = `${zodCode}.describe(${JSON.stringify(s.description)})`;
  }

  if (!isRequired) {
    zodCode = `${zodCode}.optional()`;
  }

  return zodCode;
}

/**
 * Converts a JSON schema object type to a z.object() code string.
 */
export function jsonSchemaToZodObjectCode(
  schema: Record<string, unknown>
): string {
  if (!schema || schema.type !== "object") {
    return "z.object({})";
  }

  const properties = (schema.properties ?? {}) as Record<string, unknown>;
  const required = new Set(
    Array.isArray(schema.required) ? (schema.required as string[]) : []
  );

  const entries = Object.entries(properties);
  if (entries.length === 0) {
    return "z.object({})";
  }

  const propsCode = entries
    .map(([key, propertySchema]) => {
      const isReq = required.has(key);
      const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)
        ? key
        : JSON.stringify(key);
      return `  ${safeKey}: ${jsonSchemaToZodCode(propertySchema, isReq)}`;
    })
    .join(",\n");

  return `z.object({\n${propsCode},\n})`;
}
