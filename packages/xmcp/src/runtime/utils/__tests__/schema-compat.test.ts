import test from "node:test";
import assert from "node:assert";
import { z as zodV3 } from "zod/v3";
import { z as zodV4 } from "zod/v4";
import { completable, isCompletable } from "@modelcontextprotocol/server";
import { rawShapeToStandardSchema } from "../schema-compat";

test("rawShapeToStandardSchema validates and converts zod v3 fields", async () => {
  const schema = rawShapeToStandardSchema({
    name: zodV3.string().min(2),
    enabled: zodV3.boolean().default(true),
    note: zodV3.string().optional(),
  });

  const result = await schema["~standard"].validate({ name: "xmcp" });
  assert.deepStrictEqual(result, { value: { name: "xmcp", enabled: true } });

  const jsonSchema = schema["~standard"].jsonSchema.input({
    target: "draft-2020-12",
  });
  assert.deepStrictEqual(jsonSchema.required, ["name"]);
  assert.strictEqual(jsonSchema.type, "object");
  assert.ok("enabled" in (jsonSchema.properties as Record<string, unknown>));

  const outputJsonSchema = schema["~standard"].jsonSchema.output({
    target: "draft-2020-12",
  });
  assert.deepStrictEqual(outputJsonSchema.required, ["name", "enabled"]);
});

test("rawShapeToStandardSchema validates and converts zod v4 fields", async () => {
  const schema = rawShapeToStandardSchema(
    {
      count: zodV4.coerce.number().int(),
      label: zodV4.string().optional(),
    },
    { strict: true }
  );

  const result = await schema["~standard"].validate({ count: "4" });
  assert.deepStrictEqual(result, { value: { count: 4 } });

  const invalid = await schema["~standard"].validate({
    count: 4,
    extra: true,
  });
  assert.ok("issues" in invalid);
  assert.match(invalid.issues?.[0]?.message ?? "", /Unrecognized key/);

  const jsonSchema = schema["~standard"].jsonSchema.output({
    target: "draft-2020-12",
  });
  assert.strictEqual(jsonSchema.additionalProperties, false);
});

test("rawShapeToStandardSchema preserves completable fields", () => {
  const field = completable(zodV4.string(), async () => ["one", "two"]);
  const schema = rawShapeToStandardSchema({ value: field });

  assert.strictEqual(schema.shape.value, field);
  assert.strictEqual(isCompletable(schema.shape.value), true);
});
