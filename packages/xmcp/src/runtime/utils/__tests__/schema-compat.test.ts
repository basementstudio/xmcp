import test from "node:test";
import assert from "node:assert";
import { z as zodV3 } from "zod/v3";
import { z as zodV4 } from "zod/v4";
import { completable, isCompletable } from "@modelcontextprotocol/server";
import {
  assertObjectInputSchema,
  rawShapeToStandardSchema,
  toolSchemaToStandardSchema,
} from "../schema-compat";

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

test("toolSchemaToStandardSchema wraps complete zod v3 and v4 schemas", async () => {
  for (const list of [
    zodV3.array(zodV3.object({ id: zodV3.number() })),
    zodV4.array(zodV4.object({ id: zodV4.number() })),
  ]) {
    const schema = toolSchemaToStandardSchema(list);
    assert.deepStrictEqual(await schema["~standard"].validate([{ id: 1 }]), {
      value: [{ id: 1 }],
    });
    const invalid = await schema["~standard"].validate([{ id: "1" }]);
    assert.ok("issues" in invalid && invalid.issues?.length);
    const jsonSchema = schema["~standard"].jsonSchema.output({
      target: "draft-2020-12",
    });
    assert.strictEqual(jsonSchema.type, "array");
    assert.strictEqual(
      (jsonSchema.items as Record<string, unknown>).type,
      "object"
    );
  }
});

test("toolSchemaToStandardSchema keeps complete schema validation and shape", async () => {
  const field = completable(zodV4.string(), async () => ["one"]);
  const range = zodV4
    .object({ from: zodV4.number(), to: zodV4.number(), label: field })
    .refine(({ from, to }) => from <= to, "from must not exceed to");
  const schema = toolSchemaToStandardSchema(range);

  const invalid = await schema["~standard"].validate({
    from: 2,
    to: 1,
    label: "x",
  });
  assert.ok("issues" in invalid);
  assert.match(invalid.issues?.[0]?.message ?? "", /from must not exceed to/);

  const object = toolSchemaToStandardSchema(
    zodV4.object({ label: field, extra: zodV4.number().optional() })
  );
  assert.strictEqual(object.shape?.label, field);
  const jsonSchema = object["~standard"].jsonSchema.input({
    target: "draft-2020-12",
  });
  assert.strictEqual(jsonSchema.type, "object");
  assert.notStrictEqual(jsonSchema.additionalProperties, false);
});

test("toolSchemaToStandardSchema converts discriminated unions", () => {
  const schema = toolSchemaToStandardSchema(
    zodV4.discriminatedUnion("kind", [
      zodV4.object({ kind: zodV4.literal("id"), id: zodV4.number() }),
      zodV4.object({ kind: zodV4.literal("name"), name: zodV4.string() }),
    ])
  );
  const jsonSchema = schema["~standard"].jsonSchema.input({
    target: "draft-2020-12",
  });
  assert.ok(Array.isArray(jsonSchema.oneOf ?? jsonSchema.anyOf));
});

test("assertObjectInputSchema rejects non-object input schemas", () => {
  assert.throws(
    () => assertObjectInputSchema(zodV4.array(zodV4.string()), "tags"),
    /Invalid schema for tool "tags": tool input schemas must describe an object, got JSON Schema type "array"/
  );
  assert.doesNotThrow(() =>
    assertObjectInputSchema(zodV3.object({ q: zodV3.string() }), "search")
  );
  assert.doesNotThrow(() =>
    assertObjectInputSchema(
      zodV4.union([
        zodV4.object({ id: zodV4.number() }),
        zodV4.object({ name: zodV4.string() }),
      ]),
      "lookup"
    )
  );
});
