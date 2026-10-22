import assert from "node:assert/strict";
import {
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test, type TestContext } from "node:test";
import { bundleRequire } from "bundle-require";
import { z } from "zod";
import {
  parseImportOpenApiOptions,
  runImportOpenApi,
} from "../../commands/import-openapi.js";
import { buildOpenApiTools } from "../openapi.js";

function spec(version = "3.1.0") {
  return {
    openapi: version,
    info: { title: "Fixture", version: "1" },
    servers: [{ url: "https://example.test/v1" }],
    paths: {
      "/users/{id}": {
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        get: {
          operationId: "get-user",
          parameters: [] as unknown[],
          responses: { "200": { description: "OK" } },
        },
      },
    },
  };
}

async function directory(context: TestContext) {
  const root = await mkdtemp(join(tmpdir(), "xmcp-openapi-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

for (const version of ["3.0.4", "3.1.2"]) {
  test(`generated ${version} input schemas enforce types, constraints, references and optional values`, async (context) => {
    const root = await directory(context);
    const input = spec(version);
    Object.assign(input, {
      components: {
        schemas: { "Page/Size": { type: "integer", minimum: 1, maximum: 10 } },
        parameters: {
          page: {
            name: "page",
            in: "query",
            schema: { $ref: "#/components/schemas/Page~1Size" },
          },
        },
      },
    });
    input.paths["/users/{id}"].get.parameters = [
      { $ref: "#/components/parameters/page" },
      {
        name: "flags",
        in: "query",
        schema: { type: "array", items: { type: "boolean" }, minItems: 1 },
      },
      { name: "state", in: "query", schema: { type: "integer", enum: [0, 1] } },
      {
        name: "score",
        in: "query",
        schema: version.startsWith("3.0")
          ? { type: "number", minimum: 0, exclusiveMinimum: true }
          : { type: "number", exclusiveMinimum: 0 },
      },
    ];
    const source = join(root, "openapi.json");
    await writeFile(source, JSON.stringify(input));
    const files = await runImportOpenApi({
      file: source,
      out: root,
      help: false,
    });
    await symlink(
      fileURLToPath(new URL("../../../node_modules", import.meta.url)),
      join(root, "node_modules"),
      "junction"
    );
    // xmcp's main runtime bundle is CommonJS; the E2E matrix separately
    // verifies generated tools inside both supported application formats.
    const { mod } = await bundleRequire({ filepath: files[0], format: "cjs" });
    const schema = z.object(mod.schema);
    assert.deepEqual(
      schema.parse({
        id: "a/b",
        page: 2,
        flags: [true, false],
        state: 0,
        score: 0.1,
      }),
      { id: "a/b", page: 2, flags: [true, false], state: 0, score: 0.1 }
    );
    assert.deepEqual(schema.parse({ id: "a" }), { id: "a" });
    for (const invalid of [
      {},
      { id: 1 },
      { id: "a", page: 1.5 },
      { id: "a", page: 11 },
      { id: "a", page: 0 },
      { id: "a", flags: [] },
      { id: "a", flags: ["true"] },
      { id: "a", state: 2 },
      { id: "a", score: 0 },
    ])
      assert.equal(
        schema.safeParse(invalid).success,
        false,
        JSON.stringify(invalid)
      );
    assert.equal(mod.metadata.name, "get-user");
    assert.equal(mod.metadata.annotations.readOnlyHint, true);
  });
}

test("operation selection, fallback names, overrides, and path-level parameters follow OpenAPI precedence", () => {
  const input = spec();
  Object.assign(input.paths, {
    "/users": { post: { operationId: "create-user" }, get: { responses: {} } },
  });
  assert.deepEqual(
    buildOpenApiTools(input).map((tool) => tool.name),
    ["get-user", "get-users"]
  );
  assert.deepEqual(
    buildOpenApiTools(input, { operations: ["GET /users"] }).map(
      (tool) => tool.name
    ),
    ["get-users"]
  );
  assert.throws(
    () => buildOpenApiTools(input, { operations: ["missing"] }),
    /Unknown operation/
  );
  assert.throws(
    () => buildOpenApiTools(input, { operations: ["create-user"] }),
    /only GET/
  );
  const item = input.paths["/users/{id}"];
  Object.assign(item, { servers: [{ url: "https://path.test/path" }] });
  Object.assign(item.get, {
    servers: [{ url: "https://operation.test/base" }],
  });
  item.get.parameters.push({
    name: "id",
    in: "path",
    required: true,
    schema: { type: "integer" },
  });
  assert.match(
    buildOpenApiTools(input)[0].content,
    /https:\/\/operation.test\/base/
  );
  assert.match(
    buildOpenApiTools(input)[0].content,
    /"id": z.number\(\).int\(\)/
  );
  assert.match(
    buildOpenApiTools(input, { baseUrl: "https://override.test/" })[0].content,
    /https:\/\/override.test/
  );
});

test("unsupported schemas, serialization, security, and references fail with actionable locations", () => {
  const cases: [unknown, RegExp][] = [
    [{ type: "object" }, /scalar/],
    [{ type: ["string", "null"] }, /scalar/],
    [{ type: "string", nullable: true }, /nullable/],
    [{ type: "string", format: "custom" }, /format/],
    [{ oneOf: [{ type: "string" }] }, /oneOf/],
    [{ type: "integer", enum: ["1"] }, /enum/],
    [{ type: "number", enum: [Infinity] }, /enum/],
    [
      { type: "array", items: { type: "array", items: { type: "string" } } },
      /items/,
    ],
    [{ $ref: "https://example.test/schema.json" }, /local/],
    [{ $ref: "#/missing" }, /unresolved/],
    [{ type: "string", pattern: "[" }, /pattern/],
  ];
  for (const [schema, message] of cases) {
    const input = spec();
    input.paths["/users/{id}"].get.parameters.push({
      name: "filter",
      in: "query",
      schema,
    });
    assert.throws(() => buildOpenApiTools(input), message);
  }
  for (const mutation of [
    { requestBody: {} },
    { security: [{ token: [] }] },
    {
      parameters: [{ name: "token", in: "header", schema: { type: "string" } }],
    },
    {
      parameters: [
        {
          name: "q",
          in: "query",
          style: "deepObject",
          schema: { type: "string" },
        },
      ],
    },
    {
      parameters: [
        {
          name: "q",
          in: "query",
          allowReserved: true,
          schema: { type: "string" },
        },
      ],
    },
    {
      parameters: [
        {
          name: "q",
          in: "query",
          schema: { $ref: "#/components/schemas/loop" },
        },
      ],
    },
  ]) {
    const input = spec();
    Object.assign(input, {
      components: { schemas: { loop: { $ref: "#/components/schemas/loop" } } },
    });
    Object.assign(input.paths["/users/{id}"].get, mutation);
    assert.throws(() => buildOpenApiTools(input), /GET \/users\/\{id\}/);
  }
});

test("invalid selections, path bindings, servers and normalized filename collisions are rejected", () => {
  for (const input of [
    null,
    {},
    { openapi: "2.0", paths: {} },
    { openapi: "3.2.0", paths: {} },
  ])
    assert.throws(() => buildOpenApiTools(input));
  const missing = spec();
  missing.paths["/users/{id}"].parameters = [];
  assert.throws(() => buildOpenApiTools(missing), /missing path parameter/);
  const traversal = spec();
  Object.assign(traversal.paths, {
    "/%2e%2e/other": { get: { operationId: "other" } },
  });
  assert.throws(() => buildOpenApiTools(traversal), /path template/);
  const relative = spec();
  relative.servers[0].url = "/api";
  assert.throws(() => buildOpenApiTools(relative), /--base-url/);
  assert.equal(
    buildOpenApiTools(relative, { baseUrl: "https://example.test" }).length,
    1
  );
  const collision = spec();
  Object.assign(collision.paths, {
    "/other": { get: { operationId: "get_user" } },
  });
  assert.throws(() => buildOpenApiTools(collision), /same tool name/);
  collision.paths["/users/{id}"].get.operationId = "../CON";
  assert.throws(() => buildOpenApiTools(collision), /portable/);
});

test("validates the entire import before writing and never overwrites existing tools", async (context) => {
  const root = await directory(context);
  const file = join(root, "openapi.json");
  const out = join(root, "tools");
  const input = spec();
  Object.assign(input.paths, {
    "/broken": { get: { operationId: "broken", requestBody: {} } },
  });
  await writeFile(file, JSON.stringify(input));
  await assert.rejects(runImportOpenApi({ file, out, help: false }), /bodies/);
  assert.deepEqual(await readdir(root), ["openapi.json"]);
  const options = { file, out, help: false, operations: ["get-user"] };
  const paths = await runImportOpenApi(options);
  const original = await readFile(paths[0], "utf8");
  await assert.rejects(runImportOpenApi(options), /overwrite/);
  assert.equal(await readFile(paths[0], "utf8"), original);
  await rm(paths[0]);
  await writeFile(join(out, "get-user.tsx"), "existing react tool");
  await assert.rejects(runImportOpenApi(options), /overwrite/);
  assert.deepEqual(await readdir(out), ["get-user.tsx"]);
  await writeFile(file, "openapi: 3.1.0");
  await assert.rejects(runImportOpenApi(options), /JSON/);
});

test("CLI options are non-interactive and reject ambiguous or unknown input", () => {
  assert.deepEqual(
    parseImportOpenApiOptions([
      "api.json",
      "--operations",
      "one, two",
      "--operations",
      "three",
      "--out",
      "tools",
      "--base-url",
      "https://api.test",
    ]),
    {
      file: "api.json",
      operations: ["one", "two", "three"],
      out: "tools",
      baseUrl: "https://api.test",
      help: false,
    }
  );
  assert.ok(parseImportOpenApiOptions(["--help"]).help);
  for (const args of [
    [],
    ["api.json", "other.json"],
    ["api.json", "--out"],
    ["api.json", "--operations", "one,"],
    ["api.json", "--overwrite"],
  ])
    assert.throws(() => parseImportOpenApiOptions(args));
});
