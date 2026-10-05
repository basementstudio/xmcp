import test from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport, McpServer } from "@modelcontextprotocol/server";
import type { ComponentsConfig } from "../../../config";
import type { ComponentMetadata } from "../../../types/component";
import { filterComponents } from "../component-visibility";
import { loadToolModules } from "../tool-loader";
import { loadPromptModules } from "../prompt-loader";
import { loadResourceModules } from "../resource-loader";

const modules = new Map<
  string,
  { metadata?: ComponentMetadata & { name?: string } }
>([
  ["src/tools/fallback.ts", {}],
  [
    "src/tools/renamed.ts",
    { metadata: { name: "search", tags: ["public", "read"] } },
  ],
  [
    "src/tools/edit.ts",
    { metadata: { name: "edit", tags: ["public", "write"] } },
  ],
  ["src/tools/disabled.ts", { metadata: { enabled: false, tags: ["public"] } }],
]);

function paths(rules: ComponentsConfig) {
  return [...filterComponents(modules, rules).keys()];
}

test("omitted rules preserve the original modules; empty rules leave enabled components available", () => {
  assert.strictEqual(filterComponents(modules), modules);
  assert.deepEqual(paths({}), [...modules.keys()].slice(0, 3));
  assert.deepEqual(paths({ exclude: {} }), paths({}));
  assert.deepEqual(paths({ include: {} }), []);
  assert.deepEqual(paths({ include: { names: [], tags: [] } }), []);
});

test("include matches a name or any tag; explicit names replace the file name", () => {
  assert.deepEqual(
    paths({ include: { names: ["fallback"], tags: ["read"] } }),
    ["src/tools/fallback.ts", "src/tools/renamed.ts"]
  );
  assert.deepEqual(paths({ include: { names: ["search"] } }), [
    "src/tools/renamed.ts",
  ]);
  assert.deepEqual(paths({ include: { names: ["renamed"] } }), []);
  assert.deepEqual(
    paths({ include: { names: ["SEARCH", "*"], tags: ["Public"] } }),
    []
  );
});

test("exclude wins over include and does not mutate the source map or metadata", () => {
  const before = structuredClone(modules);
  assert.deepEqual(
    paths({
      include: { names: ["search"], tags: ["public"] },
      exclude: { names: ["search"], tags: ["write"] },
    }),
    []
  );
  assert.deepEqual(paths({ exclude: { tags: ["write"] } }), [
    "src/tools/fallback.ts",
    "src/tools/renamed.ts",
  ]);
  assert.deepEqual(modules, before);
});

test("include cannot re-enable disabled metadata", () => {
  assert.deepEqual(
    paths({ include: { names: ["disabled"], tags: ["public"] } }),
    ["src/tools/renamed.ts", "src/tools/edit.ts"]
  );
});

test("configureServer filters every component kind and keeps generated UI resources with their owner", async (t) => {
  const globals = globalThis as Record<string, unknown>;
  Object.assign(globals, {
    SERVER_INFO: { name: "visibility", version: "1" },
    INJECTED_TOOLS: {},
    INJECTED_PROMPTS: {},
    INJECTED_RESOURCES: {},
    INJECTED_MIDDLEWARE: undefined,
    COMPONENTS_CONFIG: {
      include: { tags: ["public"] },
      exclude: { tags: ["internal"] },
    } satisfies ComponentsConfig,
  });
  const { configureServer } = await import("../server");
  const fixture = (name: string, tags: string[]) => ({
    metadata: { name, tags },
    default: () => {
      assert.ok(!tags.includes("internal"), "Excluded handler ran");
      return "available";
    },
  });
  const { toolModules } = await loadToolModules({
    "widget.ts": async () => ({
      ...fixture("widget", ["public"]),
      metadata: { name: "widget", tags: ["public"], _meta: { ui: {} } },
    }),
    "hidden.ts": async () => ({
      ...fixture("hidden", ["public", "internal"]),
      metadata: {
        name: "hidden",
        tags: ["public", "internal"],
        _meta: { ui: {} },
      },
    }),
  });
  const { promptModules } = await loadPromptModules({
    "visible.ts": async () => fixture("visible", ["public"]),
    "hidden.ts": async () => fixture("hidden", ["public", "internal"]),
    "omitted.ts": async () => fixture("omitted", []),
  });
  const { resourceModules } = await loadResourceModules({
    "(visibility)/visible.ts": async () => fixture("visible", ["public"]),
    "(visibility)/hidden.ts": async () =>
      fixture("hidden", ["public", "internal"]),
    "(visibility)/visible/[id]/index.ts": async () =>
      fixture("visible-template", ["public"]),
    "(visibility)/hidden/[id]/index.ts": async () =>
      fixture("hidden-template", ["public", "internal"]),
  });
  const server = new McpServer({ name: "visibility", version: "1" });
  await configureServer(server, toolModules, promptModules, resourceModules);
  const client = new Client({ name: "test", version: "1" });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  t.after(async () => {
    await client.close();
    await server.close();
  });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  assert.deepEqual(
    (await client.listTools()).tools.map(({ name }) => name),
    ["widget"]
  );
  assert.deepEqual(
    (await client.listPrompts()).prompts.map(({ name }) => name),
    ["visible"]
  );
  assert.deepEqual(
    (await client.listResources()).resources.map(({ uri }) => uri),
    ["ui://app/widget.html", "visibility://visible"]
  );
  assert.deepEqual(
    (await client.listResourceTemplates()).resourceTemplates.map(
      ({ name }) => name
    ),
    ["visible-template"]
  );
  await assert.rejects(
    client.callTool({ name: "hidden", arguments: {} }),
    /not found/i
  );
  await assert.rejects(client.getPrompt({ name: "hidden" }), /not found/i);
  await assert.rejects(client.getPrompt({ name: "omitted" }), /not found/i);
  for (const uri of [
    "ui://app/hidden.html",
    "visibility://hidden",
    "visibility://hidden/1",
  ]) {
    await assert.rejects(client.readResource({ uri }), /not found/i);
  }
  const [ui] = (await client.readResource({ uri: "ui://app/widget.html" }))
    .contents;
  assert.ok("text" in ui);
  assert.equal(ui.text, "available");
});
