import assert from "node:assert/strict";
import { test } from "node:test";

import {
  inputRequired,
  ResourceTemplate,
  type ServerContext,
} from "@modelcontextprotocol/server";

import type {
  McpMiddlewareContext,
  McpMiddlewareResult,
} from "../../../types/mcp-middleware";
import { createExecutionLogger } from "../execution-logger";
import { wrapToolWithMiddleware } from "../mcp-middleware";

function context(
  method: "tools/call" | "prompts/get" | "resources/read" = "tools/call",
  controller = new AbortController()
): McpMiddlewareContext {
  return {
    method,
    params:
      method === "resources/read"
        ? { uri: "private://users/secret-id?token=secret-token" }
        : { name: "example", arguments: { password: "secret-password" } },
    signal: controller.signal,
    http: { id: "http-id", headers: { authorization: "Bearer secret-token" } },
  } as unknown as McpMiddlewareContext;
}

function capture() {
  const lines: string[] = [];
  const logger = createExecutionLogger((line) => lines.push(line));
  return {
    ...logger,
    lines,
    events: () => lines.map((line) => JSON.parse(line)),
  };
}

test("pairs start/end events for tools, prompts and resources without request or response data", async () => {
  for (const method of [
    "tools/call",
    "prompts/get",
    "resources/read",
  ] as const) {
    const logger = capture();
    logger.registerResource(
      "user-profile",
      new ResourceTemplate("private://users/{id}{?token}", { list: undefined })
    );
    const result = {
      content: [{ type: "text" as const, text: "secret-result" }],
    };
    assert.strictEqual(
      await logger.middleware(context(method), async () => result),
      result
    );
    const [start, end] = logger.events();
    assert.equal(logger.lines.length, 2);
    assert.equal(start.event.action, "execution.start");
    assert.equal(end.event.action, "execution.end");
    assert.equal(end.event.outcome, "success");
    assert.equal(end.xmcp.status, "success");
    assert.equal(
      end.xmcp.component,
      method === "resources/read" ? "user-profile" : "example"
    );
    assert.equal(start.transaction.id, end.transaction.id);
    assert.equal(start.http.request.id, "http-id");
    assert.ok(end.event.duration >= 0);
    assert.ok(Number.isInteger(end.event.duration));
    assert.ok(Number.isFinite(Date.parse(end["@timestamp"])));
    assert.doesNotMatch(
      logger.lines.join(""),
      /secret-|password|authorization/
    );
  }
});

test("static resources use their registered identity; invalid and unknown URIs never get logged", async () => {
  const logger = capture();
  logger.registerResource("public-info", "PRIVATE://info");
  for (const uri of [
    "private://info",
    "private://unknown/secret",
    "malformed-secret",
  ]) {
    const ctx = context("resources/read");
    await logger.middleware(
      { ...ctx, params: { uri } } as McpMiddlewareContext,
      async () => ({ contents: [] })
    );
  }
  assert.deepEqual(
    logger
      .events()
      .filter((event) => event.event.action === "execution.end")
      .map((event) => event.xmcp.component),
    ["public-info", "unknown", "unknown"]
  );
  assert.doesNotMatch(logger.lines.join(""), /secret/);
});

test("classifies returned errors, thrown values, input-required rounds and cancellation", async () => {
  for (const kind of [
    "returned",
    "thrown",
    "input_required",
    "cancelled",
    "cancelled-return",
  ] as const) {
    const logger = capture();
    const controller = new AbortController();
    const exception = {
      message: "secret-exception",
      toJSON() {
        assert.fail("serialized exception");
      },
    };
    const result =
      kind === "input_required"
        ? inputRequired({
            inputRequests: {
              confirm: inputRequired.elicit({
                message: "secret-input",
                requestedSchema: { type: "object", properties: {} },
              }),
            },
          })
        : {
            isError: true,
            content: [{ type: "text" as const, text: "secret-error" }],
          };
    const run = async () =>
      logger.middleware(context("tools/call", controller), async () => {
        if (kind.startsWith("cancelled")) controller.abort(exception);
        if (kind === "thrown" || kind === "cancelled") throw exception;
        return result;
      });
    if (kind === "thrown" || kind === "cancelled")
      await assert.rejects(run, (error) => error === exception);
    else assert.strictEqual(await run(), result);
    const events = logger.events();
    assert.equal(events.length, 2);
    assert.equal(
      events[1].xmcp.status,
      kind.startsWith("cancelled")
        ? "cancelled"
        : kind === "input_required"
          ? kind
          : "failure"
    );
    assert.doesNotMatch(logger.lines.join(""), /secret-/);
  }
});

test("sits before application middleware, sees short circuits, and isolates concurrent executions", async () => {
  const logger = capture();
  let entered = 0;
  let release!: () => void;
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  const handler = wrapToolWithMiddleware(
    () => assert.fail("short-circuited handler ran"),
    "example",
    [
      logger.middleware,
      async () => {
        if (++entered === 2) release();
        await ready;
        return { content: [], isError: true };
      },
    ]
  );
  const ctx = {
    mcpReq: { signal: new AbortController().signal },
  } as ServerContext;
  await Promise.all([handler({}, ctx), handler({}, ctx)]);
  const events = logger.events();
  const ids = new Set(events.map((event) => event.transaction.id));
  assert.equal(ids.size, 2);
  assert.equal(events.length, 4);
  for (const id of ids) {
    const pair = events.filter((event) => event.transaction.id === id);
    assert.equal(pair[0].event.action, "execution.start");
    assert.equal(pair[1].xmcp.status, "failure");
    assert.equal(pair[0].http, undefined);
  }
});

test("copies only valid W3C trace identifiers", async () => {
  const trace = "4bf92f3577b34da6a3ce929d0e0e4736";
  const parent = "00f067aa0ba902b7";
  for (const value of [
    `00-${trace}-${parent}-01`,
    `00-${"0".repeat(32)}-${parent}-01`,
    `00-${trace}-${"0".repeat(16)}-01`,
    `ff-${trace}-${parent}-01`,
    `00-${trace}-${parent}-01-extra`,
    "secret-invalid",
    [`00-${trace}-${parent}-01`],
  ]) {
    const logger = capture();
    const ctx = context();
    await logger.middleware(
      {
        ...ctx,
        http: {
          id: "http-id",
          headers: {
            traceparent: value,
            tracestate: "secret-state",
            baggage: "secret-baggage",
          },
        },
      },
      async () => ({ content: [] })
    );
    const [event] = logger.events();
    const valid = value === `00-${trace}-${parent}-01`;
    assert.deepEqual(event.trace, valid ? { id: trace } : undefined);
    assert.deepEqual(event.parent, valid ? { id: parent } : undefined);
    assert.doesNotMatch(logger.lines.join(""), /secret-/);
  }
});

test("sink failures and hostile result serialization leave results and exceptions intact", async () => {
  const logger = createExecutionLogger(() => {
    throw new Error("sink failed");
  });
  const result = {
    content: [],
    toJSON() {
      assert.fail("serialized result");
    },
  };
  assert.strictEqual(
    await logger.middleware(context(), async () => result),
    result
  );
  const exception = new Error("original");
  await assert.rejects(
    async () =>
      logger.middleware(context(), async () => {
        throw exception;
      }),
    (error) => error === exception
  );
  const hostile = new Proxy(
    {},
    {
      get(_target, key) {
        if (key === "then") return undefined;
        throw new Error("getter");
      },
      has() {
        throw new Error("has");
      },
    }
  ) as McpMiddlewareResult;
  assert.strictEqual(
    await logger.middleware(context(), async () => hostile),
    hostile
  );
});

test("ignores listings and completion", async () => {
  const logger = capture();
  for (const method of [
    "tools/list",
    "prompts/list",
    "resources/list",
    "resources/templates/list",
    "completion/complete",
  ] as const) {
    await logger.middleware(
      { ...context(), method, params: {} } as McpMiddlewareContext,
      async () => ({ content: [] })
    );
  }
  assert.deepEqual(logger.lines, []);
});

test("event serialization failures do not change execution", async (t) => {
  const logger = capture();
  const result = { content: [] };
  t.mock.method(JSON, "stringify", () => {
    throw new Error("serialization failed");
  });
  const actual = await logger.middleware(context(), async () => result);
  t.mock.restoreAll();
  assert.strictEqual(actual, result);
  assert.deepEqual(logger.lines, []);
});
