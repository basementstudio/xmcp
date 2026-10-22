import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport, McpServer } from "@modelcontextprotocol/server";
import type { ComponentMetadata } from "../../../types/component";
import { toMcpMetadata } from "../component-metadata";
import { addToolsToServer } from "../tools";
import { addPromptsToServer } from "../prompts";
import { addResourcesToServer } from "../resources";
import { loadToolModules } from "../tool-loader";
import { loadPromptModules } from "../prompt-loader";
import { loadResourceModules } from "../resource-loader";
import { uIResourceRegistry } from "../ext-apps-registry";

const icons: ComponentMetadata["icons"] = [
  {
    src: "https://example.com/icon.png",
    mimeType: "image/png",
    sizes: ["48x48"],
    theme: "dark",
  },
];

async function connect(
  t: TestContext,
  options: ComponentMetadata & { _meta?: Record<string, unknown> } = {}
) {
  const server = new McpServer({ name: "component-metadata", version: "1" });
  uIResourceRegistry.clear();
  t.after(async () => {
    await client.close();
    await server.close();
    uIResourceRegistry.clear();
  });
  const fixture = (enabled: boolean) => ({
    metadata: { name: enabled ? "visible" : "hidden", ...options, enabled },
    default: () => {
      assert.ok(enabled, "A disabled handler must never run");
      return "available";
    },
  });
  const { toolModules } = await loadToolModules({
    "visible.ts": async () => fixture(true),
    "hidden.ts": async () => fixture(false),
    "hidden-ui.tsx": async () => ({
      ...fixture(false),
      metadata: { name: "hidden-ui", enabled: false, _meta: { ui: {} } },
    }),
  });
  const { promptModules } = await loadPromptModules({
    "visible.ts": async () => fixture(true),
    "hidden.ts": async () => fixture(false),
  });
  const { resourceModules } = await loadResourceModules({
    "(metadata)/visible.ts": async () => fixture(true),
    "(metadata)/hidden.ts": async () => fixture(false),
    "(metadata)/visible/[id]/index.ts": async () => ({
      ...fixture(true),
      metadata: { ...fixture(true).metadata, name: "visible-template" },
    }),
    "(metadata)/hidden/[id]/index.ts": async () => ({
      ...fixture(false),
      metadata: { ...fixture(false).metadata, name: "hidden-template" },
    }),
  });
  addToolsToServer(server, toolModules);
  addPromptsToServer(server, promptModules);
  addResourcesToServer(server, resourceModules);
  const client = new Client({ name: "test", version: "1" });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return client;
}

test("component metadata preserves custom keys, gives tags precedence, and omits framework fields", () => {
  const _meta = Object.freeze({ custom: "kept", "xmcp/tags": ["old"] });
  const metadata = { icons, tags: ["new"], enabled: true, _meta };
  const result = toMcpMetadata(metadata);
  assert.deepEqual(result, {
    icons,
    _meta: { custom: "kept", "xmcp/tags": ["new"] },
  });
  assert.deepEqual(_meta["xmcp/tags"], ["old"]);
  assert.deepEqual(toMcpMetadata({ tags: [] })._meta, { "xmcp/tags": [] });
  assert.equal(toMcpMetadata({})._meta, undefined);
  assert.strictEqual(toMcpMetadata({ _meta })._meta, _meta);
});

test("icons and tags round-trip through all four SDK listings", async (t) => {
  const client = await connect(t, {
    icons,
    tags: ["catalog"],
    _meta: { custom: "kept" },
  });
  const components = [
    ...(await client.listTools()).tools,
    ...(await client.listPrompts()).prompts,
    ...(await client.listResources()).resources,
    ...(await client.listResourceTemplates()).resourceTemplates,
  ];
  assert.equal(components.length, 4);
  for (const component of components) {
    assert.deepEqual(component.icons, icons);
    assert.deepEqual(component._meta, {
      custom: "kept",
      "xmcp/tags": ["catalog"],
    });
    assert.equal("enabled" in component, false);
    assert.equal("tags" in component, false);
  }
});

test("disabled tools and their generated UI resources are absent and return not-found errors", async (t) => {
  const client = await connect(t);
  assert.deepEqual(
    (await client.listTools()).tools.map((tool) => tool.name),
    ["visible"]
  );
  assert.equal(uIResourceRegistry.has("hidden-ui"), false);
  for (const name of ["hidden", "hidden-ui"]) {
    await assert.rejects(
      client.callTool({ name, arguments: {} }),
      /not found/i
    );
  }
  await assert.rejects(
    client.readResource({ uri: "ui://app/hidden-ui.html" }),
    /not found/i
  );
  const result = await client.callTool({ name: "visible", arguments: {} });
  assert.deepEqual(result.content, [{ type: "text", text: "available" }]);
});

test("disabled prompts are absent and cannot be fetched", async (t) => {
  const client = await connect(t);
  assert.deepEqual(
    (await client.listPrompts()).prompts.map((prompt) => prompt.name),
    ["visible"]
  );
  await assert.rejects(client.getPrompt({ name: "hidden" }), /not found/i);
  assert.equal(
    (await client.getPrompt({ name: "visible", arguments: {} })).messages
      .length,
    1
  );
});

test("disabled static resources and templates are absent and cannot be read", async (t) => {
  const client = await connect(t);
  assert.deepEqual(
    (await client.listResources()).resources.map((resource) => resource.name),
    ["visible"]
  );
  assert.deepEqual(
    (await client.listResourceTemplates()).resourceTemplates.map(
      (resource) => resource.name
    ),
    ["visible-template"]
  );
  for (const uri of ["metadata://hidden", "metadata://hidden/123"]) {
    await assert.rejects(client.readResource({ uri }), /not found/i);
  }
  for (const uri of ["metadata://visible", "metadata://visible/123"]) {
    const [content] = (await client.readResource({ uri })).contents;
    assert.ok("text" in content);
    assert.equal(content.text, "available");
  }
});

test("omitting enabled keeps a component registered and preserves UI metadata with tags", async (t) => {
  const server = new McpServer({ name: "default-metadata", version: "1" });
  uIResourceRegistry.clear();
  t.after(() => uIResourceRegistry.clear());
  const { toolModules } = await loadToolModules({
    "widget.ts": async () => ({
      metadata: {
        name: "widget",
        tags: ["ui"],
        icons,
        _meta: {
          ui: { visibility: ["model"], prefersBorder: true },
          custom: "kept",
        },
      },
      default: () => "widget",
    }),
  });
  addToolsToServer(server, toolModules);
  const client = new Client({ name: "test", version: "1" });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  t.after(async () => {
    await client.close();
    await server.close();
  });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  const [tool] = (await client.listTools()).tools;
  assert.deepEqual(tool.icons, icons);
  assert.deepEqual(tool._meta, {
    "ui/visibility": ["model"],
    "ui/resourceUri": "ui://app/widget.html",
    custom: "kept",
    "xmcp/tags": ["ui"],
  });
  assert.equal(uIResourceRegistry.has("widget"), true);
});
