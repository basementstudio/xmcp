import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";

import { Client } from "@modelcontextprotocol/client";
import {
  completable,
  InMemoryTransport,
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/server";
import { z } from "zod";

import type {
  McpAuthorize,
  McpAuthorizeOperation,
  McpMiddleware,
} from "@/types/mcp-middleware";

import { uIResourceRegistry } from "../ext-apps-registry";
import { normalizeAuthorize } from "../mcp-authorization";
import { getRequestContext } from "../../contexts/request-context";
import { wrapToolWithMiddleware } from "../mcp-middleware";
import { registerWithMcpMiddleware } from "../mcp-middleware";

const DENY = { "xmcp/tags": ["deny"] };
const NO_CALL = { "xmcp/tags": ["no-call"] };

function ran(): never {
  throw new Error("Denied handler ran");
}

/** Registers one allowed and one denied component of every kind. */
async function connect(
  t: TestContext,
  authorize: McpAuthorize,
  middleware: McpMiddleware[] = []
) {
  const server = new McpServer({ name: "authorization-test", version: "1" });
  registerWithMcpMiddleware(
    server,
    middleware,
    () => {
      server.registerTool(
        "open",
        { description: "Allowed", inputSchema: z.object({ n: z.number() }) },
        async ({ n }) => ({ content: [{ type: "text", text: String(n) }] })
      );
      server.registerTool(
        "hidden",
        {
          description: "Denied",
          inputSchema: z.object({ n: z.number() }),
          _meta: DENY,
        },
        ran
      );
      server.registerTool(
        "listed",
        { description: "Listed only", _meta: NO_CALL },
        ran
      );
      server.registerPrompt(
        "open",
        {
          argsSchema: z.object({
            value: completable(z.string(), (value) => [value + "!"]),
          }),
        },
        ({ value }) => ({
          messages: [{ role: "user", content: { type: "text", text: value } }],
        })
      );
      server.registerPrompt(
        "hidden",
        {
          _meta: DENY,
          argsSchema: z.object({ value: completable(z.string(), ran) }),
        },
        ran
      );
      server.registerResource("open", "test://open", {}, async (uri) => ({
        contents: [{ uri: uri.href, text: "open" }],
      }));
      server.registerResource("hidden", "test://hidden", { _meta: DENY }, ran);
      server.registerResource(
        "hidden-template",
        new ResourceTemplate("test://secret/{id}", {
          list: async () => ({
            resources: [{ name: "secret", uri: "test://secret/one" }],
          }),
          complete: { id: ran },
        }),
        { _meta: DENY },
        ran
      );
    },
    authorize
  );
  const client = new Client({ name: "test", version: "1" });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  t.after(async () => {
    await client.close();
    await server.close();
  });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return { client, server };
}

const tagPolicy: McpAuthorize = (_ctx, component, operation) => {
  const tags = component.metadata.tags ?? [];
  return (
    !tags.includes("deny") &&
    !(tags.includes("no-call") && operation === "call")
  );
};

async function rejection(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    const { code, message, data } = error as {
      code: number;
      message: string;
      data?: unknown;
    };
    return { code, message, data };
  }
  assert.fail("Expected the request to be rejected");
}

test("hides denied components from every listing", async (t) => {
  const { client } = await connect(t, tagPolicy);
  assert.deepEqual(
    (await client.listTools()).tools.map((tool) => tool.name),
    ["open", "listed"]
  );
  assert.deepEqual(
    (await client.listPrompts()).prompts.map((prompt) => prompt.name),
    ["open"]
  );
  // Template-produced resources follow their template.
  assert.deepEqual(
    (await client.listResources()).resources.map((resource) => resource.uri),
    ["test://open"]
  );
  assert.deepEqual(
    (await client.listResourceTemplates()).resourceTemplates,
    []
  );
});

test("rejects denied direct access exactly like an unknown component", async (t) => {
  const { client } = await connect(t, tagPolicy);
  const unknownTool = await rejection(
    client.callTool({ name: "missing", arguments: {} })
  );
  for (const [name, args] of [
    ["hidden", { n: 1 }],
    // Denial precedes argument validation, so invalid input reveals nothing.
    ["hidden", { n: "invalid" }],
    ["listed", {}],
  ] as const) {
    assert.deepEqual(
      await rejection(client.callTool({ name, arguments: args })),
      {
        ...unknownTool,
        message: unknownTool.message.replace("missing", name),
      }
    );
  }
  const unknownPrompt = await rejection(client.getPrompt({ name: "missing" }));
  assert.deepEqual(
    await rejection(
      client.getPrompt({ name: "hidden", arguments: { value: "x" } })
    ),
    {
      ...unknownPrompt,
      message: unknownPrompt.message.replace("missing", "hidden"),
    }
  );
  for (const uri of ["test://hidden", "test://secret/one"]) {
    const unknown = await rejection(
      client.readResource({ uri: uri.replace("test", "other") })
    );
    const denied = await rejection(client.readResource({ uri }));
    assert.deepEqual(denied, {
      code: unknown.code,
      message: `Resource not found: ${uri}`,
      data: { uri },
    });
  }
  const open = await client.callTool({ name: "open", arguments: { n: 2 } });
  assert.deepEqual(open.content, [{ type: "text", text: "2" }]);
  const read = await client.readResource({ uri: "test://open" });
  assert.equal(read.contents.length, 1);
});

test("denied completions match unknown references without running completers", async (t) => {
  const { client } = await connect(t, tagPolicy);
  for (const ref of [
    { type: "ref/prompt", name: "hidden" },
    { type: "ref/resource", uri: "test://secret/{id}" },
    { type: "ref/resource", uri: "test://hidden" },
  ] as const) {
    const argument = {
      name: ref.type === "ref/prompt" ? "value" : "id",
      value: "a",
    };
    const unknownRef =
      ref.type === "ref/prompt"
        ? { type: "ref/prompt" as const, name: "missing" }
        : { type: "ref/resource" as const, uri: "test://missing" };
    const unknown = await rejection(
      client.complete({ ref: unknownRef, argument })
    );
    assert.deepEqual(await rejection(client.complete({ ref, argument })), {
      ...unknown,
      message: unknown.message.replace(
        ref.type === "ref/prompt" ? "missing" : "test://missing",
        ref.type === "ref/prompt" ? ref.name : ref.uri
      ),
    });
  }
  const allowed = await client.complete({
    ref: { type: "ref/prompt", name: "open" },
    argument: { name: "value", value: "a" },
  });
  assert.deepEqual(allowed.completion.values, ["a!"]);
});

test("passes the request context, registered metadata and operation, before user middleware", async (t) => {
  const seen: string[] = [];
  const reached: string[] = [];
  const { client } = await connect(
    t,
    (ctx, component, operation) => {
      assert.ok(Object.isFrozen(component.metadata));
      if (component.type === "tool" && component.name === "hidden") {
        assert.deepEqual(component.metadata.tags, ["deny"]);
        assert.equal(component.metadata.description, "Denied");
      }
      if (component.type === "resourceTemplate") {
        assert.equal(component.uriTemplate, "test://secret/{id}");
      }
      seen.push(
        `${ctx.method} ${component.type}:${component.name} ${operation}`
      );
      return tagPolicy(ctx, component, operation);
    },
    [
      (ctx, next) => {
        reached.push(ctx.method);
        return next();
      },
    ]
  );
  await client.callTool({ name: "open", arguments: { n: 1 } });
  await rejection(client.callTool({ name: "hidden", arguments: { n: 1 } }));
  await client.readResource({ uri: "test://open" });
  await rejection(client.readResource({ uri: "test://secret/one" }));
  assert.deepEqual(seen, [
    "tools/call tool:open call",
    "tools/call tool:hidden call",
    "resources/read resource:open read",
    "resources/read resourceTemplate:hidden-template read",
  ]);
  // Only the allowed read reached user middleware.
  assert.deepEqual(reached, ["resources/read"]);
});

test("denies unless the policy returns true, and surfaces policy errors", async (t) => {
  const { client } = await connect(t, () => undefined as unknown as boolean);
  assert.deepEqual((await client.listTools()).tools, []);
  const failing = await connect(t, (_ctx, component) => {
    if (component.name === "open") throw new Error("policy failed");
    return true;
  });
  await assert.rejects(
    failing.client.callTool({ name: "open", arguments: { n: 1 } }),
    /policy failed/
  );
});

test("generated UI resources follow their owning tool", async (t) => {
  uIResourceRegistry.clear();
  t.after(() => uIResourceRegistry.clear());
  const operations: McpAuthorizeOperation[] = [];
  const server = new McpServer({ name: "authorization-test", version: "1" });
  registerWithMcpMiddleware(
    server,
    [],
    () => {
      // The SDK installs completion only when a completable component exists.
      server.registerPrompt(
        "completion",
        {
          argsSchema: z.object({
            value: completable(z.string(), (value) => [value]),
          }),
        },
        () => ({ messages: [] })
      );
      server.registerTool("widget", { _meta: DENY }, ran);
      uIResourceRegistry.add("widget", {
        name: "widget",
        uri: "ui://app/widget.html",
        mimeType: "text/html;profile=mcp-app",
        handler: ran,
      });
      server.registerResource("widget", "ui://app/widget.html", {}, ran);
    },
    (_ctx, component, operation) => {
      assert.equal(component.type, "tool");
      operations.push(operation);
      return false;
    }
  );
  const client = new Client({ name: "test", version: "1" });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  t.after(async () => {
    await client.close();
    await server.close();
  });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  assert.deepEqual((await client.listResources()).resources, []);
  await assert.rejects(
    client.readResource({ uri: "ui://app/widget.html" }),
    /Resource not found/
  );
  const argument = { name: "id", value: "a" };
  const unknown = await rejection(
    client.complete({
      ref: { type: "ref/resource", uri: "ui://app/missing.html" },
      argument,
    })
  );
  assert.deepEqual(
    await rejection(
      client.complete({
        ref: { type: "ref/resource", uri: "ui://app/widget.html" },
        argument,
      })
    ),
    {
      ...unknown,
      message: unknown.message.replace("missing.html", "widget.html"),
    }
  );
  assert.deepEqual(operations, ["list", "read", "complete"]);
});

test("restores registration methods and validates the export", () => {
  const server = new McpServer({ name: "authorization-test", version: "1" });
  const { registerTool, registerPrompt, registerResource } = server;
  assert.throws(
    () =>
      registerWithMcpMiddleware(
        server,
        [],
        () => {
          throw new Error("registration failed");
        },
        () => true
      ),
    /registration failed/
  );
  assert.strictEqual(server.registerTool, registerTool);
  assert.strictEqual(server.registerPrompt, registerPrompt);
  assert.strictEqual(server.registerResource, registerResource);
  assert.equal(normalizeAuthorize(undefined), undefined);
  assert.throws(
    () => normalizeAuthorize({ allow: true }),
    /export authorize as a function/
  );
});

test("tool policy values reach middleware and handlers while raw inputs stay unparsed", async (t) => {
  const server = new McpServer({ name: "scope-test", version: "1" });
  const seen: unknown[] = [];
  const middleware: McpMiddleware[] = [
    async (ctx, next) => {
      if (ctx.method === "tools/call") {
        assert.equal(ctx.get("caller"), String(ctx.params.arguments.n));
        assert.equal(typeof ctx.params.arguments.n, "number");
      }
      return next();
    },
  ];
  registerWithMcpMiddleware(
    server,
    middleware,
    () => {
      server.registerTool(
        "parsed",
        { inputSchema: z.object({ n: z.coerce.number().default(7) }) },
        wrapToolWithMiddleware(
          async (args) => {
            await Promise.resolve();
            const caller = getRequestContext().get<string>("caller");
            assert.equal(caller, String(args.n));
            return { content: [{ type: "text", text: caller! }] };
          },
          { name: "parsed", description: "" },
          middleware
        ) as never
      );
    },
    (ctx, _component, operation) => {
      if (operation === "call" && ctx.method === "tools/call") {
        assert.equal(ctx.get("caller"), undefined);
        seen.push(ctx.params.arguments.n);
        ctx.set("caller", String(ctx.params.arguments.n ?? 7));
      }
      return true;
    }
  );
  const client = new Client({ name: "test", version: "1" });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  t.after(async () => {
    await client.close();
    await server.close();
  });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  const results = await Promise.all(
    ["1", "2"].map((n) => client.callTool({ name: "parsed", arguments: { n } }))
  );
  results.push(await client.callTool({ name: "parsed", arguments: {} }));
  results.push(await client.callTool({ name: "parsed", arguments: {} }));
  assert.deepEqual(
    results.map((result) => result.content),
    ["1", "2", "7", "7"].map((text) => [{ type: "text", text }])
  );
  assert.deepEqual(seen, ["1", "2", undefined, undefined]);
  assert.throws(() => getRequestContext(), /only be used while handling/);
});
