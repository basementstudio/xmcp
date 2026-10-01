import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CLIENT_INFO_META_KEY,
  McpServer,
  InMemoryTransport,
  ResourceTemplate,
  type ServerContext,
} from "@modelcontextprotocol/server";
import { Client } from "@modelcontextprotocol/client";
import type { McpMiddleware } from "@/types/mcp-middleware";
import { getRequestContext } from "../../contexts/request-context";
import {
  normalizeMcpMiddleware,
  registerWithMcpMiddleware,
  wrapToolWithMiddleware,
} from "../mcp-middleware";
import { transformToolHandler } from "../transformers/tool";

function serverContext(): ServerContext {
  return {
    mcpReq: {
      id: "call",
      signal: new AbortController().signal,
      envelope: { [CLIENT_INFO_META_KEY]: { name: "test", version: "1" } },
    },
  } as unknown as ServerContext;
}

test("middleware runs in order and shares one request scope with the tool and async helpers", async () => {
  const trace: string[] = [];
  const ctx = serverContext();
  const handler = wrapToolWithMiddleware(
    transformToolHandler(async (_args, extra) => {
      await Promise.resolve();
      trace.push("tool");
      assert.equal(getRequestContext().get("value"), "from middleware");
      assert.deepEqual(getRequestContext().clientInfo, extra.clientInfo);
      getRequestContext().set("value", "from tool");
      return "result";
    }),
    "example",
    [
      async (context, next) => {
        trace.push("first before");
        assert.equal(context.method, "tools/call");
        assert.deepEqual(context.params, { name: "example", arguments: {} });
        assert.strictEqual(context.signal, ctx.mcpReq.signal);
        assert.ok(Object.isFrozen(context));
        context.set("value", "from middleware");
        const result = await next();
        assert.equal(getRequestContext().get("value"), "from tool");
        assert.equal(context.get("value"), "from tool");
        trace.push("first after");
        return { ...result, _meta: { stamped: true } };
      },
      async (_context, next) => {
        trace.push("second before");
        const result = await next();
        trace.push("second after");
        return result;
      },
    ]
  );
  assert.deepEqual(await handler({}, ctx), {
    content: [{ type: "text", text: "result" }],
    _meta: { stamped: true },
  });
  assert.deepEqual(trace, [
    "first before",
    "second before",
    "tool",
    "second after",
    "first after",
  ]);
  assert.throws(
    getRequestContext,
    /only be used while handling an MCP request/
  );
});

test("middleware can return a result without calling later middleware or the tool", async () => {
  const result = {
    content: [{ type: "text" as const, text: "denied" }],
    isError: true,
  };
  const handler = wrapToolWithMiddleware(
    () => assert.fail("tool ran"),
    "example",
    [() => result, () => assert.fail("later middleware ran")]
  );
  assert.strictEqual(await handler({}, serverContext()), result);
});

for (const source of ["middleware", "tool"] as const) {
  test(`preserves ${source} exceptions and restores request scope`, async () => {
    const error = new Error(source);
    const handler = wrapToolWithMiddleware(
      () => {
        throw error;
      },
      "example",
      [
        (context, next) => {
          assert.strictEqual(context.signal, getRequestContext().signal);
          if (source === "middleware") throw error;
          return next();
        },
      ]
    );
    await assert.rejects(
      async () => handler({}, serverContext()),
      (caught) => caught === error
    );
    assert.throws(
      getRequestContext,
      /only be used while handling an MCP request/
    );
  });
}

for (const concurrent of [false, true]) {
  test(`rejects calling next twice (${concurrent ? "concurrently" : "sequentially"}) without executing the tool twice`, async () => {
    let calls = 0;
    const handler = wrapToolWithMiddleware(
      () => {
        calls++;
        return { content: [] };
      },
      "example",
      [
        async (_context, next) => {
          if (concurrent) return (await Promise.all([next(), next()]))[0];
          await next();
          return next();
        },
      ]
    );
    await assert.rejects(
      async () => handler({}, serverContext()),
      /next\(\) can only be called once/
    );
    assert.equal(calls, 1);
  });
}

test("normalizes absent, single, and array exports and snapshots the array", () => {
  const middleware: McpMiddleware = (_ctx, next) => next();
  assert.deepEqual(normalizeMcpMiddleware(undefined), []);
  assert.deepEqual(normalizeMcpMiddleware(middleware), [middleware]);
  const source = [middleware];
  const normalized = normalizeMcpMiddleware(source);
  source.length = 0;
  assert.deepEqual(normalized, [middleware]);
  assert.deepEqual(normalizeMcpMiddleware([]), []);
});

test("rejects invalid middleware exports instead of silently ignoring them", () => {
  for (const value of [null, {}, "invalid", [() => {}, null], [false]]) {
    assert.throws(
      () => normalizeMcpMiddleware(value),
      /must export mcp as a function or an array/
    );
  }
});

test("wraps SDK template callbacks once, preserves listing parameters, and restores registration", async (t) => {
  const server = new McpServer({ name: "middleware-test", version: "1" });
  const original = server.server.setRequestHandler;
  const events: string[] = [];
  const middleware: McpMiddleware = async (ctx, next) => {
    events.push(ctx.method + " before");
    assert.strictEqual(ctx.signal, getRequestContext().signal);
    assert.equal(ctx.get("value"), undefined);
    ctx.set("value", "request value");
    if (ctx.method === "resources/list")
      assert.equal(ctx.params.cursor, "page");
    const result = await next();
    assert.equal(ctx.get("callback"), ctx.method);
    events.push(ctx.method + " after");
    return result;
  };
  function callback(method: string) {
    assert.equal(getRequestContext().get("value"), "request value");
    getRequestContext().set("callback", method);
    events.push(method + " callback");
  }
  registerWithMcpMiddleware(server, [middleware], () => {
    server.registerResource(
      "template",
      new ResourceTemplate("test://items/{id}", {
        list: async () => {
          callback("resources/list");
          return { resources: [{ name: "one", uri: "test://items/one" }] };
        },
        complete: {
          id: async () => {
            callback("completion/complete");
            return ["one"];
          },
        },
      }),
      {},
      async (uri) => {
        callback("resources/read");
        return { contents: [{ uri: uri.href, text: "one" }] };
      }
    );
  });
  assert.strictEqual(server.server.setRequestHandler, original);
  const client = new Client({ name: "test", version: "1" });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  t.after(async () => {
    await client.close();
    await server.close();
  });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  await client.ping();
  assert.deepEqual(events, []);
  const listing = await client.listResources({ cursor: "page" });
  assert.equal(listing.resources[0].uri, "test://items/one");
  const read = await client.readResource({ uri: "test://items/one" });
  assert.ok("text" in read.contents[0]);
  assert.equal(read.contents[0].text, "one");
  const completion = await client.complete({
    ref: { type: "ref/resource", uri: "test://items/{id}" },
    argument: { name: "id", value: "o" },
  });
  assert.deepEqual(completion.completion.values, ["one"]);
  assert.deepEqual(
    events,
    ["resources/list", "resources/read", "completion/complete"].flatMap(
      (method) => [method + " before", method + " callback", method + " after"]
    )
  );
  assert.throws(
    getRequestContext,
    /only be used while handling an MCP request/
  );
});

test("restores the SDK registration method after setup fails", () => {
  const server = new McpServer({ name: "middleware-test", version: "1" });
  const original = server.server.setRequestHandler;
  const failure = new Error("registration failed");
  assert.throws(
    () =>
      registerWithMcpMiddleware(server, [], () => {
        throw failure;
      }),
    (error) => error === failure
  );
  assert.strictEqual(server.server.setRequestHandler, original);
});
