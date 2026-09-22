import assert from "node:assert/strict";
import { test } from "node:test";
import { Client } from "@modelcontextprotocol/client";
import {
  InMemoryTransport,
  McpServer,
  type LoggingMessageNotificationParams,
  type ServerContext,
} from "@modelcontextprotocol/server";
import {
  getRequestContext,
  withRequestContext,
} from "../../contexts/request-context";

function serverContext(progressToken?: string | number) {
  const notifications: unknown[] = [];
  const ctx = {
    mcpReq: {
      id: "request",
      signal: new AbortController().signal,
      _meta: progressToken === undefined ? undefined : { progressToken },
      notify: async (notification: unknown) => {
        notifications.push(notification);
      },
      log: async () => undefined,
    },
  } as unknown as ServerContext;
  return { ctx, notifications };
}

test("request-local values support string and symbol keys, replacement, and async helpers", async () => {
  const { ctx } = serverContext();
  const key = Symbol("value");
  const value = { count: 1 };
  await withRequestContext(ctx, undefined, async () => {
    const context = getRequestContext();
    assert.equal(context.get("missing"), undefined);
    context.set(key, value);
    context.set("count", 0);
    context.set("count", 2);
    await Promise.resolve();
    assert.strictEqual(getRequestContext().get(key), value);
    assert.equal(getRequestContext().get<number>("count"), 2);
    assert.ok(Object.isFrozen(context));
  });
  withRequestContext(ctx, undefined, () => {
    assert.equal(getRequestContext().get(key), undefined);
    assert.equal(getRequestContext().get("count"), undefined);
  });
});

test("overlapping tool invocations do not share local values", async () => {
  let entered = 0;
  let release!: () => void;
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  await Promise.all(
    ["first", "second"].map((value) =>
      withRequestContext(serverContext().ctx, undefined, async () => {
        const context = getRequestContext();
        assert.equal(context.get("value"), undefined);
        context.set("value", value);
        if (++entered === 2) release();
        await ready;
        assert.equal(getRequestContext().get("value"), value);
      })
    )
  );
  assert.throws(
    getRequestContext,
    /only be used while handling a tool request/
  );
});

test("nested invocations restore the caller's local values", async () => {
  const { ctx } = serverContext();
  await withRequestContext(ctx, undefined, async () => {
    getRequestContext().set("value", "outer");
    await withRequestContext(ctx, undefined, async () => {
      assert.equal(getRequestContext().get("value"), undefined);
      getRequestContext().set("value", "inner");
      await Promise.resolve();
    });
    assert.equal(getRequestContext().get("value"), "outer");
  });
});

test("progress without a token is a harmless no-op", async () => {
  const { ctx, notifications } = serverContext();
  await withRequestContext(ctx, undefined, async () => {
    await getRequestContext().progress(1);
    await getRequestContext().progress(2, 2);
  });
  assert.deepEqual(notifications, []);
});

test("progress preserves valid falsy tokens and optional totals", async () => {
  for (const progressToken of ["operation", "", 0]) {
    const { ctx, notifications } = serverContext(progressToken);
    await withRequestContext(ctx, undefined, async () => {
      await getRequestContext().progress(0, 0);
      await getRequestContext().progress(1);
    });
    assert.deepEqual(notifications, [
      {
        method: "notifications/progress",
        params: { progressToken, progress: 0, total: 0 },
      },
      {
        method: "notifications/progress",
        params: { progressToken, progress: 1 },
      },
    ]);
  }
});

test("notification helpers preserve transport failures", async () => {
  const { ctx } = serverContext("operation");
  const failure = new Error("transport closed");
  ctx.mcpReq.notify = async () => {
    throw failure;
  };
  ctx.mcpReq.log = async () => {
    throw failure;
  };
  await withRequestContext(ctx, undefined, async () => {
    await assert.rejects(
      getRequestContext().progress(1),
      (error) => error === failure
    );
    await assert.rejects(
      getRequestContext().log("info", {}),
      (error) => error === failure
    );
  });
});

for (const logging of [false, true]) {
  test(`logging respects the SDK capability (${logging}) and level filter`, async (context) => {
    const server = new McpServer(
      { name: "request-context-test", version: "1.0.0" },
      {
        capabilities: logging ? { logging: {} } : {},
      }
    );
    const client = new Client(
      { name: "request-context-client", version: "1.0.0" },
      {
        versionNegotiation: { mode: "legacy" },
      }
    );
    context.after(async () => {
      try {
        await client.close();
      } finally {
        await server.close();
      }
    });
    const messages: LoggingMessageNotificationParams[] = [];
    client.setNotificationHandler("notifications/message", ({ params }) => {
      messages.push(params);
    });
    server.registerTool("log", {}, async (ctx) =>
      withRequestContext(ctx, undefined, async () => {
        await getRequestContext().log("debug", { step: "starting" });
        await getRequestContext().log("warning", { step: "check" });
        return { content: [{ type: "text" as const, text: "done" }] };
      })
    );
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    if (logging) await client.setLoggingLevel("warning");
    const result = await client.callTool({ name: "log", arguments: {} });
    assert.notEqual(result.isError, true);
    assert.deepEqual(
      messages.map(({ level, data }) => ({ level, data })),
      logging ? [{ level: "warning", data: { step: "check" } }] : []
    );
  });
}
