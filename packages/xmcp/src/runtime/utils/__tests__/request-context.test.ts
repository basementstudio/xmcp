import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CLIENT_INFO_META_KEY,
  type ServerContext,
} from "@modelcontextprotocol/server";
import { getRequestContext } from "../../contexts/request-context";
import { httpRequestContextProvider } from "../../contexts/http-request-context";
import {
  transformToolHandler as transform,
  type UserToolHandler,
} from "../transformers/tool";
import { wrapToolWithMiddleware } from "../mcp-middleware";

// Exercise the same request boundary used by tool registration.
function createToolHandler(handler: UserToolHandler) {
  return wrapToolWithMiddleware(transform(handler), "context-test", []);
}

function serverContext(
  signal = new AbortController().signal,
  http = false,
  name?: string
): ServerContext {
  return {
    mcpReq: {
      id: "rpc-id",
      signal,
      envelope: name
        ? { [CLIENT_INFO_META_KEY]: { name, version: "1.0.0" } }
        : undefined,
    },
    http: http ? { req: new Request("http://localhost/mcp") } : undefined,
  } as unknown as ServerContext;
}

const outsideRequest = () =>
  assert.throws(
    getRequestContext,
    /only be used while handling a tool request/
  );

test("throws outside a tool request before and after a successful handler", async () => {
  outsideRequest();
  await httpRequestContextProvider({ id: "http-id", headers: {} }, async () => {
    outsideRequest();
    await createToolHandler(() => {
      assert.equal(getRequestContext().http?.id, "http-id");
      return "ok";
    })({}, serverContext(undefined, true));
    outsideRequest();
  });
  outsideRequest();
});

test("isolates overlapping HTTP requests across async helpers", async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let entered = 0;
  let bothEntered!: () => void;
  const ready = new Promise<void>((resolve) => {
    bothEntered = resolve;
  });

  async function helper() {
    const before = getRequestContext();
    if (++entered === 2) bothEntered();
    await gate;
    assert.strictEqual(getRequestContext(), before);
    return before;
  }

  const requests = ["first", "second"].map((name) => {
    const signal = new AbortController().signal;
    return httpRequestContextProvider(
      {
        id: name,
        headers: { "x-request": name },
        clientInfo: { name, version: "1.0.0" },
      },
      () =>
        createToolHandler(async (_args, extra) => {
          const context = await helper();
          assert.equal(context.http?.id, name);
          assert.equal(context.http?.headers["x-request"], name);
          assert.equal(context.clientInfo?.name, name);
          assert.deepEqual(context.clientInfo, extra.clientInfo);
          assert.strictEqual(context.signal, signal);
          assert.strictEqual(context.signal, extra.signal);
          return "ok";
        })({}, serverContext(signal, true))
    );
  });
  await ready;
  outsideRequest();
  release();
  await Promise.all(requests);
  outsideRequest();
});

test("does not expose HTTP details on STDIO after an HTTP request", async () => {
  await httpRequestContextProvider(
    { id: "previous-http", headers: { "x-request": "previous" } },
    () => createToolHandler(() => "ok")({}, serverContext(undefined, true))
  );
  await createToolHandler(() => {
    const context = getRequestContext();
    assert.equal(context.http, undefined);
    assert.deepEqual(context.clientInfo, {
      name: "stdio-client",
      version: "1.0.0",
    });
    return "ok";
  })({}, serverContext(undefined, false, "stdio-client"));
});

test("copies and freezes metadata without freezing the underlying request", async () => {
  const headers = { "x-values": ["one", "two"] };
  const clientInfo = { name: "client", version: "1.0.0" };
  await httpRequestContextProvider({ id: "http-id", headers, clientInfo }, () =>
    createToolHandler((_args, extra) => {
      const context = getRequestContext();
      assert.ok(Object.isFrozen(context));
      assert.ok(Object.isFrozen(context.http));
      assert.ok(Object.isFrozen(context.http?.headers));
      assert.ok(Object.isFrozen(context.http?.headers["x-values"]));
      assert.ok(Object.isFrozen(context.clientInfo));
      assert.notStrictEqual(context.clientInfo, extra.clientInfo);
      headers["x-values"].push("three");
      clientInfo.name = "changed";
      assert.deepEqual(context.http?.headers["x-values"], ["one", "two"]);
      assert.equal(context.clientInfo?.name, "client");
      return "ok";
    })({}, serverContext(undefined, true))
  );
});

test("preserves the live SDK signal and clears scope after handler errors", async () => {
  const controller = new AbortController();
  const reason = new Error("cancelled");
  const handler = createToolHandler(async () => {
    const { signal } = getRequestContext();
    assert.strictEqual(signal, controller.signal);
    assert.equal(signal.aborted, false);
    controller.abort(reason);
    await Promise.resolve();
    assert.equal(getRequestContext().signal.aborted, true);
    signal.throwIfAborted();
    return "unreachable";
  });
  await assert.rejects(
    async () => handler({}, serverContext(controller.signal)),
    (error: unknown) => error === reason
  );
  outsideRequest();
  const error = new Error("handler failed");
  await assert.rejects(
    async () =>
      createToolHandler(() => {
        throw error;
      })({}, serverContext()),
    (caught: unknown) => caught === error
  );
  outsideRequest();
});
