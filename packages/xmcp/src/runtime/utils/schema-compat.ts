import { zodToJsonSchema } from "zod-to-json-schema";
import { toJSONSchema as zodV4ToJsonSchema } from "zod/v4";
import type { StandardSchemaWithJSON } from "@modelcontextprotocol/server";

/**
 * A single field schema from either zod major. zod v3 (>= 3.24) and zod v4
 * both expose `~standard.validate`; zod v4.2+ additionally exposes
 * `~standard.jsonSchema`. xmcp operates on fields structurally so user
 * schemas keep working regardless of which zod instance created them.
 */
export interface StandardFieldSchema {
  "~standard": {
    version: number;
    vendor: string;
    validate: (value: unknown) =>
      | { value: unknown; issues?: undefined }
      | {
          issues: ReadonlyArray<{
            message: string;
            path?: ReadonlyArray<unknown>;
          }>;
        }
      | Promise<
          | { value: unknown; issues?: undefined }
          | {
              issues: ReadonlyArray<{
                message: string;
                path?: ReadonlyArray<unknown>;
              }>;
            }
        >;
    jsonSchema?: {
      input: (options: { target: string }) => Record<string, unknown>;
      output: (options: { target: string }) => Record<string, unknown>;
    };
  };
  safeParse?: (
    value: unknown
  ) => { success: false } | { success: true; data: unknown };
}

export function isStandardFieldSchema(
  value: unknown
): value is StandardFieldSchema {
  if (typeof value !== "object" || value === null) return false;
  const standard = (value as StandardFieldSchema)["~standard"];
  return (
    typeof standard === "object" &&
    standard !== null &&
    typeof standard.validate === "function"
  );
}

/** True when the field is a zod v3 schema (no `_zod` marker, v3 `_def`). */
function isZodV3Field(field: StandardFieldSchema): boolean {
  return (
    field["~standard"].vendor === "zod" && !("_zod" in field) && "_def" in field
  );
}

function fieldToJsonSchema(
  field: StandardFieldSchema,
  target: string,
  direction: "input" | "output"
): Record<string, unknown> {
  const standard = field["~standard"];

  if (standard.jsonSchema) {
    return standard.jsonSchema[direction]({ target });
  }

  if (isZodV3Field(field)) {
    const converted = zodToJsonSchema(field as never, {
      $refStrategy: "none",
      target: target === "openapi-3.0" ? "openApi3" : "jsonSchema7",
    }) as Record<string, unknown>;
    delete converted.$schema;
    return converted;
  }

  // zod v4 below 4.2 has no `~standard.jsonSchema`; convert through the
  // module-level API (works across zod v4 instances, like the SDK's own
  // fallback).
  if (standard.vendor === "zod" && "_zod" in field) {
    try {
      const converted = zodV4ToJsonSchema(field as never) as Record<
        string,
        unknown
      >;
      delete converted.$schema;
      return converted;
    } catch (error) {
      throw new Error(
        `Failed to convert a zod schema to JSON Schema (zod v4 without ` +
          `"~standard.jsonSchema"). Upgrade to zod >= 4.2.0. ` +
          `Original error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  throw new Error(
    `Schema library "${standard.vendor}" cannot be converted to JSON Schema. ` +
      `Use zod v3 (>= 3.25.76), zod >= 4.2.0, or a Standard Schema library ` +
      `implementing "~standard.jsonSchema".`
  );
}

function isOptionalField(
  field: StandardFieldSchema,
  direction: "input" | "output"
): boolean {
  if (typeof field.safeParse !== "function") return false;
  try {
    const result = field.safeParse(undefined);
    return (
      result.success && (direction === "input" || result.data === undefined)
    );
  } catch {
    return false;
  }
}

export type RawShape = Record<string, StandardFieldSchema>;

/**
 * Assembles a Standard Schema object from a raw `{ field: zodSchema }` shape,
 * validating and converting per field. This is what lets xmcp keep its
 * `zod ^3 || ^4` peer contract with SDK v2, which registers schemas through
 * the Standard Schema interface instead of zod instances: no `z.object()`
 * composition happens, so fields never cross zod-instance boundaries.
 *
 * The returned schema exposes the raw fields as `shape` so the SDK can find
 * `completable()` fields for `completion/complete`.
 */
export function rawShapeToStandardSchema(
  shape: RawShape,
  options: { strict?: boolean } = {}
): StandardSchemaWithJSON<Record<string, unknown>, Record<string, unknown>> & {
  shape: RawShape;
} {
  const { strict = false } = options;
  const fields = Object.entries(shape);

  const toJsonSchema =
    (direction: "input" | "output") =>
    ({ target }: { target: string }) => {
      const properties: Record<string, unknown> = {};
      const required: string[] = [];
      for (const [key, field] of fields) {
        properties[key] = fieldToJsonSchema(field, target, direction);
        if (!isOptionalField(field, direction)) required.push(key);
      }
      const jsonSchema: Record<string, unknown> = {
        type: "object",
        properties,
      };
      if (required.length > 0) jsonSchema.required = required;
      if (strict) jsonSchema.additionalProperties = false;
      return jsonSchema;
    };

  const validate = async (value: unknown) => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return { issues: [{ message: "Expected an object." }] };
    }
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    const issues: Array<{ message: string; path: unknown[] }> = [];

    for (const [key, field] of fields) {
      const result = await field["~standard"].validate(input[key]);
      if (result.issues) {
        for (const issue of result.issues) {
          issues.push({
            message: issue.message,
            path: [key, ...(issue.path ?? [])],
          });
        }
      } else if (key in input || result.value !== undefined) {
        output[key] = result.value;
      }
    }

    if (strict) {
      for (const key of Object.keys(input)) {
        if (!(key in shape)) {
          issues.push({ message: `Unrecognized key: "${key}"`, path: [key] });
        }
      }
    }

    return issues.length > 0 ? { issues } : { value: output };
  };

  return {
    shape,
    "~standard": {
      version: 1,
      vendor: "xmcp",
      validate,
      jsonSchema: {
        input: toJsonSchema("input"),
        output: toJsonSchema("output"),
      },
    },
  } as StandardSchemaWithJSON<
    Record<string, unknown>,
    Record<string, unknown>
  > & { shape: RawShape };
}
