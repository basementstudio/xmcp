import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CLIENT_INFO_META_KEY,
  type ServerContext,
} from "@modelcontextprotocol/server";
import type { McpMiddleware } from "@/types/mcp-middleware";
import { getRequestContext } from "../../contexts/request-context";
import {
  normalizeMcpMiddleware,
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
    /only be used while handling a tool request/
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
      /only be used while handling a tool request/
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
