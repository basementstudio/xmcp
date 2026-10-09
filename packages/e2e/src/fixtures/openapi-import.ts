import assert from "node:assert/strict";
import { once } from "node:events";
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { createServer } from "node:http";
import { join } from "node:path";
import { E2E_ROOT } from "../harness/fixture.js";
import { runDeveloperCli } from "../harness/developer-cli.js";

/** Keep the upstream API alive while the compiled fixture calls generated tools. */
export async function prepareOpenApiFixture() {
  const server = createServer(async (request, response) => {
    const url = new URL(request.url!, "http://fixture.test");
    if (url.searchParams.get("status") === "503") {
      response.writeHead(503).end("upstream unavailable");
      return;
    }
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const body = Buffer.concat(chunks).toString("utf8");
    response.setHeader("Content-Type", "application/json");
    response.end(
      JSON.stringify({
        method: request.method,
        path: url.pathname,
        query: url.search,
        ...(request.method !== "GET"
          ? {
              headers: {
                authorization: request.headers.authorization,
                contentType: request.headers["content-type"],
                label: request.headers["x-label"],
                flags: request.headers["x-flags"],
                count: request.headers["x-count"],
              },
              body: body ? JSON.parse(body) : undefined,
            }
          : {}),
      })
    );
  });
  const ready = once(server, "listening");
  server.listen(0, "127.0.0.1");
  await ready;
  const close = () =>
    new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const spec = {
      openapi: "3.1.0",
      info: { title: "Import fixture", version: "1" },
      servers: [{ url: `http://127.0.0.1:${address.port}/v1` }],
      components: {
        schemas: { id: { type: "string" } },
        securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
      },
      paths: {
        "/users/{id}": {
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/id" },
            },
          ],
          get: {
            operationId: "import-user",
            summary: "Inspect encoded path and query inputs",
            parameters: [
              { name: "q", in: "query", schema: { type: "string" } },
              {
                name: "page",
                in: "query",
                schema: { type: "integer", minimum: 0 },
              },
              { name: "active", in: "query", schema: { type: "boolean" } },
              {
                name: "tags",
                in: "query",
                explode: false,
                schema: { type: "array", items: { type: "string" } },
              },
              {
                name: "labels",
                in: "query",
                schema: { type: "array", items: { type: "string" } },
              },
              { name: "status", in: "query", schema: { type: "integer" } },
            ],
            responses: { "200": { description: "Echo" } },
          },
          put: {
            operationId: "import-update-user",
            security: [{ bearer: [] }],
            parameters: [
              { name: "q", in: "query", schema: { type: "string" } },
              {
                name: "X-Label",
                in: "header",
                required: true,
                schema: { type: "string" },
              },
              {
                name: "X-Flags",
                in: "header",
                schema: { type: "array", items: { type: "boolean" } },
              },
              { name: "X-Count", in: "header", schema: { type: "integer" } },
            ],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["name", "active", "count"],
                    properties: {
                      name: { type: "string" },
                      active: { type: "boolean" },
                      count: { type: "integer", minimum: 0 },
                      tags: { type: "array", items: { type: "string" } },
                    },
                  },
                },
              },
            },
            responses: { "200": { description: "Echo" } },
          },
          patch: {
            operationId: "import-optional-body",
            requestBody: {
              content: { "application/json": { schema: { type: "boolean" } } },
            },
            responses: { "200": { description: "Echo" } },
          },
          post: {
            operationId: "not-imported",
            responses: { "200": { description: "Unused" } },
          },
        },
      },
    };
    const work = join(E2E_ROOT, ".work");
    await mkdir(work, { recursive: true });
    const directory = await mkdtemp(join(work, "openapi-"));
    const source = JSON.stringify(spec);
    await writeFile(join(directory, "openapi.json"), source);
    const result = await runDeveloperCli(
      [
        "import-openapi",
        "openapi.json",
        "--operations",
        "import-user",
        "--out",
        "tools",
      ],
      directory,
      "import"
    );
    assert.equal(result.code, 0, `${result.stderr}\nFixture: ${directory}`);
    assert.deepEqual(await readdir(join(directory, "tools")), [
      "import-user.ts",
    ]);
    const requestArgs = [
      "import-openapi",
      "openapi.json",
      "--operations",
      "import-update-user",
      "--auth-env",
      "XMCP_E2E_OPENAPI_AUTH",
      "--out",
      "tools",
    ];
    const requestImport = await runDeveloperCli(
      requestArgs,
      directory,
      "request-import"
    );
    assert.equal(requestImport.code, 0, requestImport.stderr);
    const destination = join(directory, "tools/import-update-user.ts");
    await writeFile(destination, "// preserve edited file");
    const repeated = await runDeveloperCli(
      requestArgs,
      directory,
      "request-repeat"
    );
    assert.notEqual(repeated.code, 0);
    assert.match(repeated.stderr, /--overwrite/);
    assert.equal(
      await readFile(destination, "utf8"),
      "// preserve edited file"
    );
    const replaced = await runDeveloperCli(
      [...requestArgs, "--overwrite"],
      directory,
      "request-overwrite"
    );
    assert.equal(replaced.code, 0, replaced.stderr);
    const optional = await runDeveloperCli(
      [
        "import-openapi",
        "openapi.json",
        "--operations",
        "import-optional-body",
        "--out",
        "tools",
      ],
      directory,
      "optional-import"
    );
    assert.equal(optional.code, 0, optional.stderr);
    const files: Record<string, string> = {
      "openapi.json": source,
      // Change the server's environment after compilation and between calls.
      "src/tools/import-set-auth.ts": `import { z } from "zod";
export const schema = { value: z.string().optional() };
export default function setAuth({ value }: { value?: string }) {
  if (value === undefined) delete process.env.XMCP_E2E_OPENAPI_AUTH;
  else process.env.XMCP_E2E_OPENAPI_AUTH = value;
  return "updated";
}`,
    };
    for (const name of [
      "import-user",
      "import-update-user",
      "import-optional-body",
    ])
      files[`src/tools/${name}.ts`] = await readFile(
        join(directory, `tools/${name}.ts`),
        "utf8"
      );
    await rm(directory, { recursive: true, force: true });
    return { files, close };
  } catch (error) {
    await close();
    throw error;
  }
}
