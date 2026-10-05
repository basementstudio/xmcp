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
  assert.ok(project.dependencies.has(path.join(directory, "types.ts")));
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
  assert.ok(project.dependencies.has(path.join(directory, "base.json")));
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
