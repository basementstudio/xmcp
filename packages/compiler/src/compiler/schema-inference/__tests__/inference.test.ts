import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, test } from "node:test";

import { z } from "zod";
import { z as z3 } from "zod/v3";

import { SchemaInferenceProject } from "../project";

const directories: string[] = [];
afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});
function fixture(files: Record<string, string>) {
  const directory = mkdtempSync(path.join(tmpdir(), "xmcp-inference-"));
  directories.push(directory);
  writeFileSync(
    path.join(directory, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        types: [],
        target: "ES2022",
        moduleResolution: "Bundler",
        module: "ESNext",
      },
    })
  );
  const write = (file: string, content: string) => {
    mkdirSync(path.dirname(path.join(directory, file)), { recursive: true });
    writeFileSync(path.join(directory, file), content);
  };
  for (const [file, content] of Object.entries(files)) write(file, content);
  const project = new SchemaInferenceProject(directory);
  return { directory, project, write };
}
function load(code: string, library: unknown = z) {
  return new Function(
    "z",
    code
      .replace('import { z } from "zod";', "")
      .replace("export function", "function") + "\nreturn withInferredSchema;"
  )(library);
}

test("resolves re-exported handlers, imported aliases and JSDoc into validating schemas", () => {
  const { project } = fixture({
    "tool.ts": 'export { greet as default } from "./lib/greet";',
    "lib/greet.ts": `import type { Input } from "./input";
/** Greet the user */
export function greet(input: Input) { return input; }`,
    "lib/input.ts": `export interface Input {
/** Name to greet */
name: string;
count?: number;
nullable: string | null;
mode: "short" | "long";
tags: readonly string[];
profile: { active: boolean };
}`,
  });
  const tool = load(project.generate(["tool.ts"]))({}, "tool.ts");
  const schema = z.object(tool.schema);
  const input = {
    name: "Ada",
    nullable: null,
    mode: "short",
    tags: ["hello"],
    profile: { active: true },
  };
  assert.deepEqual(schema.parse({ ...input, ignored: true }), input);
  assert.equal(schema.safeParse({ ...input, name: 1 }).success, false);
  assert.equal(
    schema.safeParse({ ...input, profile: { active: "true" } }).success,
    false
  );
  assert.equal(schema.safeParse({ ...input, mode: "other" }).success, false);
  assert.equal(schema.safeParse({ ...input, count: "2" }).success, false);
  assert.equal(tool.schema.name.description, "Name to greet");
  assert.equal(tool.metadata.description, "Greet the user");
});

test("explicit and re-exported schemas bypass inference and metadata wins", () => {
  const { project } = fixture({
    "tool.ts": `export { schema } from "./schema";
/** Inferred description */
export default function tool<T>(input: T) { return input; }`,
    "schema.ts": "export const schema = {};",
  });
  const apply = load(project.generate(["tool.ts"]));
  const schema = { value: z.string().min(3) };
  const tool = apply(
    { schema, metadata: { description: "Explicit", name: "renamed" } },
    "tool.ts"
  );
  assert.equal(tool.schema, schema);
  assert.equal(tool.metadata.description, "Explicit");
  assert.equal(tool.metadata.name, "renamed");
  assert.deepEqual(apply({ schema: {} }, "tool.ts").schema, {});
  assert.equal(apply({ schema: undefined }, "tool.ts").schema, undefined);
});

test("preserves no-argument tools and ignores the request context parameter", () => {
  const { project } = fixture({
    "empty.ts": "export default () => 'ready';",
    "context.ts":
      "export default function(input: { name: string }, extra: { signal: AbortSignal }) { return input; }",
  });
  const apply = load(project.generate(["empty.ts", "context.ts"]));
  assert.deepEqual(apply({}, "empty.ts").schema, {});
  assert.deepEqual(Object.keys(apply({}, "context.ts").schema), ["name"]);
});

test("reuses the project while refreshing imported types, docs and configuration", () => {
  const { project, directory, write } = fixture({
    "tool.ts":
      'import type { Input } from "./types"; export default (input: Input) => input;',
    "types.ts": "export interface Input { value: string }",
  });
  const before = project.generate(["tool.ts"]);
  assert.ok(
    project.dependencies.has(
      path.join(directory, "types.ts").replaceAll("\\", "/")
    )
  );
  write(
    "types.ts",
    "export interface Input { /** Updated value */\n value: number }"
  );
  const after = project.generate(["tool.ts"]);
  assert.notEqual(after, before);
  const schema = z.object(load(after)({}, "tool.ts").schema);
  assert.equal(schema.safeParse({ value: 3 }).success, true);
  assert.equal(schema.safeParse({ value: "3" }).success, false);
  write("tsconfig.json", '{"compilerOptions":{"strict":false,"types":[]}}');
  assert.throws(() => project.generate(["tool.ts"]), /strictNullChecks/);
});

test("honors tsconfig aliases and inherited config dependencies", () => {
  const { project, directory } = fixture({
    "tsconfig.json":
      '{"extends":"./base.json","compilerOptions":{"baseUrl":".","paths":{"@lib/*":["lib/*"]}}}',
    "base.json":
      '{"compilerOptions":{"strict":true,"types":[],"moduleResolution":"Bundler","module":"ESNext"}}',
    "tool.ts":
      'import type { Input } from "@lib/input"; export default (input: Input) => input;',
    "lib/input.ts":
      "export type Input = Pick<{ value: number; unused: string }, 'value'>;",
  });
  const tool = load(project.generate(["tool.ts"]))({}, "tool.ts");
  assert.equal(z.object(tool.schema).safeParse({ value: 1 }).success, true);
  assert.ok(
    project.dependencies.has(
      path.join(directory, "base.json").replaceAll("\\", "/")
    )
  );
});

for (const type of [
  "any",
  "unknown",
  "bigint",
  "symbol",
  "Date",
  "() => void",
  "[string, number]",
  "Record<string, string>",
  "string & { brand: true }",
  "string | undefined",
]) {
  test(`rejects unsupported property type ${type} with its location`, () => {
    const { project } = fixture({
      "tool.ts": `export default (input: { value: ${type} }) => input;`,
    });
    assert.throws(
      () => project.generate(["tool.ts"]),
      /tool\.ts:1:\d+: Cannot infer tool .*\(input.value\).*Export an explicit schema/
    );
  });
}

test("rejects recursive inputs and unresolved generics without silently widening", () => {
  for (const code of [
    "interface Input { next?: Input }; export default (input: Input) => input;",
    "export default function tool<T>(input: { value: T }) { return input; }",
    "import type { Missing } from './missing'; export default (input: { value: Missing }) => input;",
    "export default (input: string) => input;",
    "interface Input extends Missing { value: string }; export default (input: Input) => input;",
  ]) {
    const { project } = fixture({ "tool.ts": code });
    assert.throws(() => project.generate(["tool.ts"]), /Cannot infer tool/);
  }
});

test("recovers when a missing imported type is created and tracks removed tools", () => {
  const { project, write } = fixture({
    "tool.ts":
      'import type { Input } from "./missing"; export default (input: Input) => input;',
  });
  assert.throws(() => project.generate(["tool.ts"]), /Cannot infer tool/);
  write("missing.ts", "export interface Input { value: string }");
  const apply = load(project.generate(["tool.ts"]));
  assert.equal(
    z.object(apply({}, "tool.ts").schema).safeParse({ value: "ok" }).success,
    true
  );
  assert.equal(
    load(project.generate([]))({ marker: true }, "tool.ts").marker,
    true
  );
});

test("generated schemas also validate with Zod 3", () => {
  const { project } = fixture({
    "tool.ts":
      "export default (input: { value: string; tags?: string[]; flag: boolean | null }) => input;",
  });
  const tool = load(project.generate(["tool.ts"]), z3)({}, "tool.ts");
  const schema = z3.object(tool.schema);
  assert.deepEqual(schema.parse({ value: "ok", flag: null }), {
    value: "ok",
    flag: null,
  });
  assert.equal(schema.safeParse({ value: 3, flag: true }).success, false);
});

for (const library of [z, z3]) {
  test(`emits enums and booleans with Zod ${library === z ? 4 : 3}`, () => {
    const { project } = fixture({
      "tool.ts": `export default (input: {
        language?: "en" | "es";
        nullableLanguage: "en" | "es" | null;
        active: boolean;
        optionalActive?: boolean;
        nullableActive: boolean | null;
        literal: true;
        mixed: "yes" | 1;
      }) => input;`,
    });
    const code = project.generate(["tool.ts"]);
    assert.match(code, /z\.enum\(/);
    const tool = load(code, library)({}, "tool.ts");
    assert.deepEqual(tool.schema.language.unwrap().options.sort(), [
      "en",
      "es",
    ]);
    assert.equal(tool.schema.active.constructor.name, "ZodBoolean");
    assert.equal(
      tool.schema.optionalActive.unwrap().constructor.name,
      "ZodBoolean"
    );
    const input = {
      active: false,
      nullableActive: null,
      nullableLanguage: null,
      literal: true,
      mixed: 1,
    };
    const schema =
      library === z ? z.object(tool.schema) : z3.object(tool.schema);
    assert.deepEqual(schema.parse(input), input);
    for (const changes of [
      { active: "false" },
      { literal: false },
      { mixed: 2 },
    ])
      assert.equal(schema.safeParse({ ...input, ...changes }).success, false);
    const invalid = schema.safeParse({ ...input, language: "fr" });
    assert.equal(invalid.success, false);
    if (!invalid.success) assert.match(invalid.error.message, /en[\s\S]*es/);
    if (library === z) {
      const properties = z.toJSONSchema(z.object(tool.schema))
        .properties as Record<string, Record<string, unknown>>;
      assert.equal(properties.active.type, "boolean");
      assert.deepEqual(properties.language.enum, ["en", "es"]);
    }
  });

  test(`validates JSDoc bounds, patterns and formats with Zod ${library === z ? 4 : 3}`, () => {
    const { project } = fixture({
      "tool.ts": 'export { default } from "./lib/tool";',
      "lib/tool.ts": `import type { Input } from "./input";
export default (input: Input) => input;`,
      "lib/input.ts": `export interface Input {
/** Day of month.
 * @minimum 1
 * @maximum 31
 */
day?: number | null;
/** Account code.
 * @minLength 2
 * @maxLength 5
 * @pattern ^[A-Z]+$
 */
code: string | null;
/** @format email */
email: string;
/** @format uri */
website?: string;
/** @format uuid */
id: string;
nested: {
/** @minimum -1.5 */
value: number };
}`,
    });
    const tool = load(project.generate(["tool.ts"]), library)({}, "tool.ts");
    assert.equal(tool.schema.day.description, "Day of month.");
    const schema =
      library === z ? z.object(tool.schema) : z3.object(tool.schema);
    const input = {
      day: 31,
      code: "ABC",
      email: "ada@example.com",
      website: "https://example.com",
      id: "123e4567-e89b-42d3-a456-426614174000",
      nested: { value: -1.5 },
    };
    assert.deepEqual(schema.parse(input), input);
    assert.equal(
      schema.safeParse({ ...input, day: null, code: null, website: undefined })
        .success,
      true
    );
    assert.equal(schema.safeParse({ ...input, day: undefined }).success, true);
    for (const changes of [
      { day: 0 },
      { day: 99 },
      { code: "A" },
      { code: "ABCDEF" },
      { code: "ab" },
      { email: "invalid" },
      { website: "invalid" },
      { id: "invalid" },
      { nested: { value: -2 } },
    ])
      assert.equal(
        schema.safeParse({ ...input, ...changes }).success,
        false,
        JSON.stringify(changes)
      );
    if (library === z) {
      const properties = z.toJSONSchema(z.object(tool.schema))
        .properties as Record<string, Record<string, unknown>>;
      assert.equal(properties.email.format, "email");
      assert.equal(properties.website.format, "uri");
      assert.equal(properties.id.format, "uuid");
    }
  });
}

for (const [type, tags, error] of [
  ["number", "@minimum NaN", /finite number/],
  ["number", "@maximum Infinity", /finite number/],
  ["number", "@minimum 1e999", /finite number/],
  ["number", "@minimum 0x10", /finite number/],
  ["number", "@minimum 1oops", /finite number/],
  ["number", "@minimum", /requires a value/],
  ["number", "@minimum 5\n * @maximum 1", /must not exceed/],
  ["number", "@minimum 1\n * @minimum 2", /duplicate/],
  ["string", "@minLength -1", /nonnegative safe integer/],
  ["string", "@maxLength 1.5", /nonnegative safe integer/],
  ["string", "@maxLength 9007199254740992", /nonnegative safe integer/],
  ["string", "@minLength 4\n * @maxLength 2", /must not exceed/],
  ["string", "@pattern [", /valid regular expression/],
  ["string", "@format date", /email, uri, or uuid/],
  ["string", "@minimum 1", /number property/],
  ["number", "@minLength 1", /string property/],
  ["boolean", "@format email", /string property/],
  ["string[]", "@pattern a", /string property/],
  ["string | number", "@maxLength 3", /string property/],
  ['"yes" | "no"', "@pattern a", /string property/],
  ["null", "@format email", /string property/],
] as const) {
  test(`rejects ${tags.replaceAll("\n", " ")} on ${type} at the property location`, () => {
    const { project } = fixture({
      "tool.ts": `export default (input: {\n/** ${tags} */\nvalue: ${type}\n}) => input;`,
    });
    assert.throws(
      () => project.generate(["tool.ts"]),
      (errorValue: unknown) => {
        assert.ok(errorValue instanceof Error);
        assert.match(
          errorValue.message,
          /tool\.ts:\d+:\d+: Cannot infer tool .*\(input.value\)/
        );
        assert.match(errorValue.message, error);
        return true;
      }
    );
  });
}

test("rejects constraint tags on handlers and preserves explicit schema overrides", () => {
  const { project, write } = fixture({
    "tool.ts":
      "/** @minimum 1 */\nexport default (input: { value: number }) => input;",
  });
  assert.throws(
    () => project.generate(["tool.ts"]),
    /belongs on an input property/
  );
  write(
    "tool.ts",
    "/** @format invalid */\nexport default (input: { /** @minimum invalid */\nvalue: number }) => input;\nexport const schema = {};"
  );
  assert.deepEqual(
    load(project.generate(["tool.ts"]))({ schema: {} }, "tool.ts").schema,
    {}
  );
});

test("constraint-only edits regenerate schemas and invalid edits recover", () => {
  const { project, write } = fixture({
    "tool.ts":
      'import type { Input } from "./input"; export default (input: Input) => input;',
    "input.ts": "export interface Input {\n/** @maximum 31 */\nday: number }",
  });
  const before = project.generate(["tool.ts"]);
  write(
    "input.ts",
    "export interface Input {\n/** @maximum 10 */\nday: number }"
  );
  const after = project.generate(["tool.ts"]);
  assert.notEqual(after, before);
  assert.equal(
    z.object(load(after)({}, "tool.ts").schema).safeParse({ day: 11 }).success,
    false
  );
  write(
    "input.ts",
    "export interface Input {\n/** @maximum invalid */\nday: number }"
  );
  assert.throws(() => project.generate(["tool.ts"]), /finite number/);
  write(
    "input.ts",
    "export interface Input {\n/** @maximum 31 */\nday: number }"
  );
  assert.equal(
    z
      .object(load(project.generate(["tool.ts"]))({}, "tool.ts").schema)
      .safeParse({ day: 11 }).success,
    true
  );
});
