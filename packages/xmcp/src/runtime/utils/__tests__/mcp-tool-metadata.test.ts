import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";

import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport, McpServer } from "@modelcontextprotocol/server";
import { z } from "zod/v3";

import type {
  McpMiddleware,
  McpMiddlewareContext,
  McpToolMetadata,
} from "@/types/mcp-middleware";

import { uIResourceRegistry } from "../ext-apps-registry";
import { registerWithMcpMiddleware } from "../mcp-middleware";
import { loadToolModules } from "../tool-loader";
import { addToolsToServer } from "../tools";

async function connect(
  t: TestContext,
  loaders: Parameters<typeof loadToolModules>[0],
  middleware: McpMiddleware
) {
  const server = new McpServer({ name: "middleware-metadata", version: "1" });
  const client = new Client({ name: "test", version: "1" });
  uIResourceRegistry.clear();
  t.after(async () => {
    await client.close();
    await server.close();
    uIResourceRegistry.clear();
  });
  const { toolModules } = await loadToolModules(loaders);
  registerWithMcpMiddleware(server, [middleware], () => {
    addToolsToServer(server, toolModules, [middleware]);
  });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return client;
}

test("middleware receives registered defaults, names, annotations, tags and UI metadata", async (t) => {
  const observed = new Map<string, McpToolMetadata>();
  const client = await connect(
    t,
    {
      "default.ts": async () => ({ default: () => "default" }),
      "source-name.ts": async () => ({
        metadata: {
          name: "renamed",
          description: "Renamed tool",
          annotations: { title: "Custom title", readOnlyHint: true },
          tags: ["read"],
          icons: [{ src: "https://example.com/icon.png", sizes: ["48x48"] }],
          _meta: { "vendor/requires": ["permission:a"], "xmcp/tags": ["old"] },
        },
        default: () => "renamed",
      }),
      "widget.tsx": async () => ({
        metadata: {
          name: "widget",
          _meta: {
            ui: { visibility: ["model"], prefersBorder: true },
            "vendor/requires": ["permission:a"],
          },
        },
        default: () => assert.fail("React handler should not be invoked"),
      }),
    },
    (ctx, next) => {
      if (ctx.method === "tools/call") {
        observed.set(ctx.params.name, ctx.tool.metadata);
        assert.ok(Object.isFrozen(ctx.tool));
        assert.equal(ctx.params.name, ctx.tool.metadata.name);
      } else {
        // @ts-expect-error Tool metadata is available only after tools/call narrowing.
        assert.equal(ctx.tool, undefined);
      }
      return next();
    }
  );
  const listing = (await client.listTools()).tools;
  for (const tool of listing) {
    await client.callTool({ name: tool.name, arguments: {} });
    const metadata = observed.get(tool.name)!;
    assert.deepEqual(metadata, {
      name: tool.name,
      description: tool.description,
      annotations: tool.annotations,
      icons: tool.icons,
      tags: tool._meta?.["xmcp/tags"],
      _meta: tool._meta,
    });
  }
  assert.equal(observed.get("default")?.description, "No description provided");
  assert.equal(observed.get("default")?.annotations?.title, "default");
  assert.deepEqual(observed.get("renamed")?.tags, ["read"]);
  assert.deepEqual(observed.get("widget")?._meta, {
    "vendor/requires": ["permission:a"],
    "ui/visibility": ["model"],
    "ui/resourceUri": "ui://app/widget.html",
  });
});

test("metadata snapshots isolate nested writes from user exports, SDK listings and later calls", async (t) => {
  const source = {
    name: "snapshot",
    description: "Snapshot",
    tags: ["original"],
    icons: [{ src: "https://example.com/icon.png", sizes: ["48x48"] }],
    annotations: { readOnlyHint: true },
    _meta: { "vendor/policy": [{ scopes: ["read"] }] },
  };
  let observed: McpToolMetadata | undefined;
  const client = await connect(
    t,
    {
      "snapshot.ts": async () => ({ metadata: source, default: () => "ok" }),
    },
    (ctx, next) => {
      if (ctx.method === "tools/call") {
        observed = ctx.tool.metadata;
        assert.ok(Object.isFrozen(observed));
        assert.ok(Object.isFrozen(observed.annotations));
        assert.throws(() => {
          // @ts-expect-error The registered name is read-only.
          ctx.tool.metadata.name = "changed";
        }, TypeError);
        assert.throws(() => {
          // @ts-expect-error Tag arrays are read-only.
          ctx.tool.metadata.tags?.push("changed");
        }, TypeError);
        const policy = observed._meta?.["vendor/policy"] as {
          scopes: string[];
        }[];
        assert.throws(() => policy[0].scopes.push("write"), TypeError);
        assert.throws(
          () => observed?.icons?.[0].sizes?.push("64x64"),
          TypeError
        );
      }
      return next();
    }
  );
  const before = await client.listTools();
  await client.callTool({ name: "snapshot", arguments: {} });
  await client.callTool({ name: "snapshot", arguments: {} });
  assert.deepEqual(await client.listTools(), before);
  assert.equal(Object.isFrozen(source), false);
  assert.equal(Object.isFrozen(source.annotations), false);
  source.tags.push("later");
  source._meta["vendor/policy"][0].scopes.push("later");
  source.icons[0].sizes.push("later");
  assert.deepEqual(observed?.tags, ["original"]);
  assert.deepEqual(observed?._meta?.["vendor/policy"], [{ scopes: ["read"] }]);
  assert.deepEqual(observed?.icons?.[0].sizes, ["48x48"]);
});

test("one metadata policy filters listings and denies direct calls before tool execution", async (t) => {
  let executions = 0;
  const canCall = (meta: Readonly<Record<string, unknown>> | undefined) =>
    !meta?.["vendor/requires"];
  const client = await connect(
    t,
    {
      "restricted.ts": async () => ({
        metadata: { _meta: { "vendor/requires": ["permission:a"] } },
        default: () => {
          executions++;
          return "restricted";
        },
      }),
      "public.ts": async () => ({
        default: () => {
          executions++;
          return "public";
        },
      }),
    },
    async (ctx, next) => {
      if (ctx.method === "tools/call" && !canCall(ctx.tool.metadata._meta)) {
        return {
          isError: true,
          content: [{ type: "text", text: "Forbidden" }],
        };
      }
      const result = await next();
      if (ctx.method === "tools/list" && Array.isArray(result.tools)) {
        return {
          ...result,
          tools: result.tools.filter((tool) => canCall(tool._meta)),
        };
      }
      return result;
    }
  );
  assert.deepEqual(
    (await client.listTools()).tools.map((tool) => tool.name),
    ["public"]
  );
  const denied = await client.callTool({ name: "restricted", arguments: {} });
  assert.equal(denied.isError, true);
  assert.equal(executions, 0);
  const allowed = await client.callTool({ name: "public", arguments: {} });
  assert.notEqual(allowed.isError, true);
  assert.equal(executions, 1);
});

test("SDK lookup, input and output validation still surround tool middleware", async (t) => {
  let middlewareCalls = 0;
  let executions = 0;
  const client = await connect(
    t,
    {
      "validated.ts": async () => ({
        schema: { count: z.number() },
        outputSchema: { count: z.number() },
        default: () => {
          executions++;
          return { structuredContent: { count: 1 } };
        },
      }),
      "disabled.ts": async () => ({
        metadata: { enabled: false },
        default: () => assert.fail("disabled tool ran"),
      }),
    },
    (ctx, next) => {
      if (ctx.method !== "tools/call") return next();
      middlewareCalls++;
      assert.equal(ctx.tool.metadata.name, "validated");
      return { content: [], structuredContent: { count: "invalid-output" } };
    }
  );
  for (const name of ["missing", "disabled"]) {
    await assert.rejects(
      client.callTool({ name, arguments: {} }),
      /not found/i
    );
  }
  const invalidInput = await client.callTool({
    name: "validated",
    arguments: { count: "invalid" },
  });
  assert.equal(invalidInput.isError, true);
  assert.equal(middlewareCalls, 0);
  const invalidOutput = await client.callTool({
    name: "validated",
    arguments: { count: 1 },
  });
  assert.equal(invalidOutput.isError, true);
  assert.equal(middlewareCalls, 1);
  assert.equal(executions, 0);
});

// Compile-time guard: an un-narrowed middleware context has no tool property.
function checkContextType(ctx: McpMiddlewareContext) {
  // @ts-expect-error Access requires a tools/call method check.
  return ctx.tool;
}
void checkContextType;
