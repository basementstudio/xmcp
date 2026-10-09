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
  const server = createServer((request, response) => {
    const url = new URL(request.url!, "http://fixture.test");
    if (url.searchParams.get("status") === "503") {
      response.writeHead(503).end("upstream unavailable");
      return;
    }
    response.setHeader("Content-Type", "application/json");
    response.end(
      JSON.stringify({
        method: request.method,
        path: url.pathname,
        query: url.search,
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
      components: { schemas: { id: { type: "string" } } },
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
    const files = {
      "openapi.json": source,
      "src/tools/import-user.ts": await readFile(
        join(directory, "tools/import-user.ts"),
        "utf8"
      ),
    };
    await rm(directory, { recursive: true, force: true });
    return { files, close };
  } catch (error) {
    await close();
    throw error;
  }
}
