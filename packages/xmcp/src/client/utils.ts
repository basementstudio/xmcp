import { JsonSchemaType } from "./types";

export function resolveRef(
  schema: JsonSchemaType,
  rootSchema: JsonSchemaType
): JsonSchemaType {
  if (!("$ref" in schema) || !schema.$ref) {
    return schema;
  }

  const ref = schema.$ref;

  // Handle simple #/properties/name references
  if (ref.startsWith("#/")) {
    const path = ref.substring(2).split("/");
    let current: unknown = rootSchema;

    for (const segment of path) {
      if (
        current &&
        typeof current === "object" &&
        current !== null &&
        segment in current
      ) {
        current = (current as Record<string, unknown>)[segment];
      } else {
        // If reference cannot be resolved, return the original schema
        console.warn(`Could not resolve $ref: ${ref}`);
        return schema;
      }
    }

    return current as JsonSchemaType;
  }

  // For other types of references, return the original schema
  console.warn(`Unsupported $ref format: ${ref}`);
  return schema;
}

export function normalizeUnionType(schema: JsonSchemaType): JsonSchemaType {
  // Handle anyOf with exactly string and null
  if (
    schema.anyOf &&
    schema.anyOf.length === 2 &&
    schema.anyOf.some((t) => (t as JsonSchemaType).type === "string") &&
    schema.anyOf.some((t) => (t as JsonSchemaType).type === "null")
  ) {
    return { ...schema, type: "string", anyOf: undefined, nullable: true };
  }

  // Handle anyOf with exactly boolean and null
  if (
    schema.anyOf &&
    schema.anyOf.length === 2 &&
    schema.anyOf.some((t) => (t as JsonSchemaType).type === "boolean") &&
    schema.anyOf.some((t) => (t as JsonSchemaType).type === "null")
  ) {
    return { ...schema, type: "boolean", anyOf: undefined, nullable: true };
  }

  // Handle anyOf with exactly number and null
  if (
    schema.anyOf &&
    schema.anyOf.length === 2 &&
    schema.anyOf.some((t) => (t as JsonSchemaType).type === "number") &&
    schema.anyOf.some((t) => (t as JsonSchemaType).type === "null")
  ) {
    return { ...schema, type: "number", anyOf: undefined, nullable: true };
  }

  // Handle anyOf with exactly integer and null
  if (
    schema.anyOf &&
    schema.anyOf.length === 2 &&
    schema.anyOf.some((t) => (t as JsonSchemaType).type === "integer") &&
    schema.anyOf.some((t) => (t as JsonSchemaType).type === "null")
  ) {
    return { ...schema, type: "integer", anyOf: undefined, nullable: true };
  }

  // Handle anyOf with exactly array and null
  if (
    schema.anyOf &&
    schema.anyOf.length === 2 &&
    schema.anyOf.some((t) => (t as JsonSchemaType).type === "array") &&
    schema.anyOf.some((t) => (t as JsonSchemaType).type === "null")
  ) {
    return { ...schema, type: "array", anyOf: undefined, nullable: true };
  }

  // Handle array type with exactly string and null
  if (
    Array.isArray(schema.type) &&
    schema.type.length === 2 &&
    schema.type.includes("string") &&
    schema.type.includes("null")
  ) {
    return { ...schema, type: "string", nullable: true };
  }

  // Handle array type with exactly boolean and null
  if (
    Array.isArray(schema.type) &&
    schema.type.length === 2 &&
    schema.type.includes("boolean") &&
    schema.type.includes("null")
  ) {
    return { ...schema, type: "boolean", nullable: true };
  }

  // Handle array type with exactly number and null
  if (
    Array.isArray(schema.type) &&
    schema.type.length === 2 &&
    schema.type.includes("number") &&
    schema.type.includes("null")
  ) {
    return { ...schema, type: "number", nullable: true };
  }

  // Handle array type with exactly integer and null
  if (
    Array.isArray(schema.type) &&
    schema.type.length === 2 &&
    schema.type.includes("integer") &&
    schema.type.includes("null")
  ) {
    return { ...schema, type: "integer", nullable: true };
  }

  return schema;
}
