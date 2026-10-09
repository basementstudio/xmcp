import assert from "node:assert/strict";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, type TestContext } from "node:test";
import { fileURLToPath } from "node:url";
import { bundleRequire } from "bundle-require";
import { z } from "zod";
import {
  parseImportOpenApiOptions,
  runImportOpenApi,
} from "../../commands/import-openapi.js";
import { buildOpenApiTools } from "../openapi.js";

function spec(schema: unknown, required = true) {
  return {
    openapi: "3.1.0",
    servers: [{ url: "https://api.test" }],
    components: {
      schemas: { payload: schema },
      securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
    },
    paths: {
      "/pets": {
        post: {
          operationId: "create-pet",
          requestBody: {
            required,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/payload" },
              },
            },
          },
          parameters: [] as unknown[],
          responses: {},
        },
      },
    },
  };
}
const selection = { operations: ["create-pet"] };
async function directory(context: TestContext) {
  const root = await mkdtemp(join(tmpdir(), "xmcp-openapi-request-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  return root;
}
async function load(context: TestContext, input: unknown) {
  const root = await directory(context);
  const tool = buildOpenApiTools(input, selection)[0];
  const filepath = join(root, `${tool.name}.ts`);
  await writeFile(filepath, tool.content);
  await symlink(
    fileURLToPath(new URL("../../../node_modules", import.meta.url)),
    join(root, "node_modules"),
    "junction"
  );
  return (await bundleRequire({ filepath, format: "cjs" })).mod;
}

for (const version of ["3.0.4", "3.1.2"]) {
  test(`${version} bodies validate nested objects, arrays, enums, bounds and required fields without losing additional properties`, async (context) => {
    const input = spec({
      type: "object",
      required: ["name", "items"],
      properties: {
        name: { type: "string", minLength: 1 },
        items: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["count"],
            properties: {
              count: { type: "integer", minimum: 0 },
              state: { type: "string", enum: ["new", "used"] },
            },
          },
        },
        flags: { type: "object", additionalProperties: { type: "boolean" } },
      },
    });
    input.openapi = version;
    const mod = await load(context, input);
    const schema = z.object(mod.schema);
    const valid = {
      body: {
        name: "a/b &雪",
        items: [{ count: 0, state: "new" }],
        flags: { active: false },
        extra: { unmodified: [null, false, 0] },
      },
    };
    assert.deepEqual(schema.parse(valid), valid);
    assert.equal(mod.metadata.annotations.readOnlyHint, false);
    for (const value of [
      {},
      { body: {} },
      { body: { name: "", items: [] } },
      { body: { name: "x", items: [{ count: -1 }] } },
      { body: { name: "x", items: [{ count: 1, extra: true }] } },
      { body: { name: "x", items: [{ count: 1, state: "bad" }] } },
      {
        body: { name: "x", items: [{ count: 1 }], flags: { active: "false" } },
      },
    ])
      assert.equal(
        schema.safeParse(value).success,
        false,
        JSON.stringify(value)
      );
  });
}

test("optional bodies preserve false, zero, and nested arrays", async (context) => {
  const mod = await load(
    context,
    spec(
      {
        type: "array",
        maxItems: 2,
        items: { type: "array", items: { type: "boolean" } },
      },
      false
    )
  );
  const schema = z.object(mod.schema);
  assert.deepEqual(schema.parse({}), {});
  assert.deepEqual(schema.parse({ body: [[false], []] }), {
    body: [[false], []],
  });
  assert.equal(schema.safeParse({ body: [[], [], []] }).success, false);
  for (const [type, value] of [
    ["boolean", false],
    ["integer", 0],
    ["string", ""],
  ] as const) {
    const scalar = await load(context, spec({ type }));
    assert.deepEqual(z.object(scalar.schema).parse({ body: value }), {
      body: value,
    });
  }
});

test("unsupported body schemas and methods fail before generating weakened schemas", () => {
  for (const schema of [
    { type: "object", required: ["missing"] },
    { type: "object", minProperties: 1 },
    { type: "array", items: { type: "string" }, uniqueItems: true },
    { type: "string", nullable: true },
    { oneOf: [{ type: "string" }] },
    {
      type: "object",
      properties: { loop: { $ref: "#/components/schemas/payload" } },
    },
  ])
    assert.throws(
      () => buildOpenApiTools(spec(schema), selection),
      /POST \/pets/
    );
  const input = spec({ type: "string" });
  const operation = input.paths["/pets"].post;
  for (const method of ["get", "delete", "head", "trace"]) {
    assert.throws(
      () =>
        buildOpenApiTools(
          { ...input, paths: { "/pets": { [method]: operation } } },
          selection
        ),
      /supported/
    );
  }
  const { requestBody, ...bodyless } = operation;
  for (const method of ["post", "put", "patch", "delete"]) {
    assert.match(
      buildOpenApiTools(
        { ...input, paths: { "/pets": { [method]: bodyless } } },
        selection
      )[0].content,
      new RegExp(`method: "${method.toUpperCase()}"`)
    );
  }
  operation.parameters.push({
    name: "body",
    in: "query",
    schema: { type: "string" },
  });
  assert.throws(() => buildOpenApiTools(input, selection), /conflicts/);
  operation.parameters = [];
  Object.assign(operation.requestBody, {
    content: { "text/plain": { schema: { type: "string" } } },
  });
  assert.throws(() => buildOpenApiTools(input, selection), /application\/json/);
});

test("header overrides are case-insensitive and reserved headers never become arguments", async (context) => {
  const input = spec({ type: "string" });
  Object.assign(input.paths["/pets"], {
    parameters: [
      {
        name: "X-Count",
        in: "header",
        required: true,
        schema: { type: "string" },
      },
    ],
  });
  input.paths["/pets"].post.parameters = [
    { name: "x-count", in: "header", schema: { type: "integer" } },
    ...["Authorization", "CONTENT-TYPE", "Accept"].map((name) => ({
      name,
      in: "header",
      schema: { type: "string" },
    })),
  ];
  const mod = await load(context, input);
  assert.deepEqual(Object.keys(mod.schema), ["x-count", "body"]);
  assert.deepEqual(z.object(mod.schema).parse({ body: "", "x-count": 0 }), {
    body: "",
    "x-count": 0,
  });
  for (const name of ["bad\r\nname", "Content-Length", "Host"]) {
    input.paths["/pets"].post.parameters = [
      { name, in: "header", schema: { type: "string" } },
    ];
    assert.throws(
      () => buildOpenApiTools(input, selection),
      /header parameter/
    );
  }
  input.paths["/pets"].post.parameters = ["X-Test", "x-test"].map((name) => ({
    name,
    in: "header",
    schema: { type: "string" },
  }));
  assert.throws(() => buildOpenApiTools(input, selection), /duplicate/);
});

test("security requirements respect operation overrides, anonymous alternatives and supported Authorization schemes", () => {
  const input = spec({ type: "string" });
  Object.assign(input, { security: [{ bearer: [] }] });
  assert.throws(() => buildOpenApiTools(input, selection), /--auth-env/);
  const options = { ...selection, authEnv: "XMCP_TEST_AUTHORIZATION" };
  assert.match(
    buildOpenApiTools(input, options)[0].content,
    /process.env\["XMCP_TEST_AUTHORIZATION"\]/
  );
  Object.assign(input.paths["/pets"].post, { security: [] });
  assert.equal(buildOpenApiTools(input, selection).length, 1);
  Object.assign(input.paths["/pets"].post, { security: [{ bearer: [] }, {}] });
  assert.equal(buildOpenApiTools(input, selection).length, 1);
  Object.assign(input.paths["/pets"].post, { security: [{ bearer: [] }] });
  for (const scheme of [
    { type: "http", scheme: "Basic" },
    { type: "apiKey", in: "header", name: "Authorization" },
  ]) {
    Object.assign(input.components.securitySchemes, { bearer: scheme });
    assert.equal(buildOpenApiTools(input, options).length, 1);
  }
  for (const scheme of [
    { type: "apiKey", in: "query", name: "token" },
    { type: "apiKey", in: "header", name: "X-Api-Key" },
    { type: "oauth2", flows: {} },
  ]) {
    Object.assign(input.components.securitySchemes, { bearer: scheme });
    assert.throws(() => buildOpenApiTools(input, options), /only HTTP/);
  }
  Object.assign(input.paths["/pets"].post, {
    security: [{ first: [], second: [] }],
  });
  assert.throws(() => buildOpenApiTools(input, options), /only HTTP/);
  assert.throws(
    () => buildOpenApiTools(input, { ...selection, authEnv: "Bearer secret" }),
    /environment variable/
  );
});

test("overwrite is explicit, preserves files on failed validation, and refuses symlinks and .tsx collisions", async (context) => {
  const root = await directory(context);
  const file = join(root, "spec.json");
  const out = join(root, "tools");
  const input = spec({ type: "string" });
  await writeFile(file, JSON.stringify(input));
  const options = { ...selection, file, out, help: false };
  const [destination] = await runImportOpenApi(options);
  await writeFile(destination, "hand edited");
  await assert.rejects(runImportOpenApi(options), /--overwrite/);
  assert.equal(await readFile(destination, "utf8"), "hand edited");
  await runImportOpenApi({ ...options, overwrite: true });
  assert.match(await readFile(destination, "utf8"), /Generated from OpenAPI/);
  await writeFile(destination, "keep this");
  Object.assign(input.paths, {
    "/broken": { post: { operationId: "broken", requestBody: {} } },
  });
  await writeFile(file, JSON.stringify(input));
  await assert.rejects(
    runImportOpenApi({
      ...options,
      operations: ["create-pet", "broken"],
      overwrite: true,
    })
  );
  assert.equal(await readFile(destination, "utf8"), "keep this");
  await writeFile(join(out, "create-pet.tsx"), "react tool");
  await assert.rejects(
    runImportOpenApi({ ...options, overwrite: true }),
    /only regular .ts/
  );
  await rm(join(out, "create-pet.tsx"));
  await rm(destination);
  const outside = join(root, "outside.ts");
  await writeFile(outside, "outside");
  await symlink(outside, destination);
  await assert.rejects(
    runImportOpenApi({ ...options, overwrite: true }),
    /only regular .ts/
  );
  assert.equal(await readFile(outside, "utf8"), "outside");
  await rm(destination);
  await mkdir(destination);
  await assert.rejects(
    runImportOpenApi({ ...options, overwrite: true }),
    /only regular .ts/
  );
  assert.deepEqual(await readdir(out), ["create-pet.ts"]);
});

test("request flags parse without requiring credentials during generation", () => {
  assert.deepEqual(
    parseImportOpenApiOptions([
      "spec.json",
      "--auth-env",
      "PET_API_AUTH",
      "--overwrite",
    ]),
    { file: "spec.json", help: false, authEnv: "PET_API_AUTH", overwrite: true }
  );
  assert.throws(
    () => parseImportOpenApiOptions(["spec.json", "--auth-env"]),
    /requires a value/
  );
});
