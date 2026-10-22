import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import { test } from "node:test";
import * as Sentry from "@sentry/node";
import type { McpMiddlewareContext, McpMiddlewareResult } from "xmcp";
import {
  sentryMiddleware,
  type SentryMiddlewareOptions,
} from "../src/index.js";

const context = (name = "greet", signal = new AbortController().signal) =>
  ({
    method: "tools/call",
    params: { name, arguments: { secret: "private-argument" } },
    signal,
  }) as McpMiddlewareContext;
const result: McpMiddlewareResult = {
  content: [{ type: "text", text: "private-result" }],
};
function harness(failure?: "scope" | "before" | "after" | "capture") {
  const scopes = new AsyncLocalStorage<Record<string, string>>();
  const events: unknown[] = [],
    attributes: Record<string, unknown>[] = [];
  const sdk = {
    withIsolationScope: (callback: (scope: unknown) => unknown) => {
      if (failure === "scope") throw new Error("telemetry failed");
      return scopes.run({}, () =>
        callback({
          setTag: (key: string, value: string) => {
            scopes.getStore()![key] = value;
          },
        })
      );
    },
    startSpan: async (
      options: unknown,
      callback: (span: unknown) => Promise<unknown>
    ) => {
      if (failure === "before") throw new Error("telemetry failed");
      const attrs = {};
      attributes.push(attrs);
      const value = await callback({
        setAttribute: (key: string, value: unknown) => {
          Object.assign(attrs, { [key]: value });
        },
        setStatus() {},
      });
      if (failure === "after") throw new Error("telemetry failed");
      return value;
    },
    captureException: (error: unknown) => {
      if (failure === "capture") throw new Error("telemetry failed");
      events.push({ error, tags: { ...scopes.getStore() } });
    },
    captureMessage: (message: string) => {
      events.push({ message, tags: { ...scopes.getStore() } });
    },
  } as unknown as SentryMiddlewareOptions["sentry"];
  return { middleware: sentryMiddleware({ sentry: sdk }), events, attributes };
}
for (const failure of [
  undefined,
  "scope",
  "before",
  "after",
  "capture",
] as const) {
  test(`telemetry failure ${failure} never replaces results or repeats tools`, async () => {
    const { middleware } = harness(failure);
    let calls = 0;
    assert.equal(
      await middleware(context(), async () => {
        calls++;
        return result;
      }),
      result
    );
    assert.equal(calls, 1);
    const error = new Error("tool error");
    calls = 0;
    await assert.rejects(
      async () =>
        middleware(context(), async () => {
          calls++;
          throw error;
        }),
      (actual) => actual === error
    );
    assert.equal(calls, 1);
  });
}
test("records error results without recording content, arguments or resource URIs", async () => {
  const { middleware, events, attributes } = harness();
  const error = { ...result, isError: true };
  assert.equal(await middleware(context(), async () => error), error);
  assert.equal(events.length, 1);
  assert.equal(attributes[0]["xmcp.outcome"], "error");
  assert.doesNotMatch(JSON.stringify(events), /private-/);
});
test("input-required rounds and cancellation are not captured as errors", async () => {
  const { middleware, events, attributes } = harness();
  const intermediate = {
    resultType: "input_required",
    inputRequests: {},
  } as McpMiddlewareResult;
  assert.equal(
    await middleware(context(), async () => intermediate),
    intermediate
  );
  const controller = new AbortController(),
    error = new Error("cancelled");
  await assert.rejects(
    async () =>
      middleware(context("greet", controller.signal), async () => {
        controller.abort();
        throw error;
      }),
    (actual) => actual === error
  );
  assert.deepEqual(events, []);
  assert.equal(attributes[0]["xmcp.outcome"], "input_required");
  assert.equal(attributes[1]["xmcp.outcome"], "cancelled");
});
test("concurrent scopes retain the correct tool tag", async () => {
  const { middleware, events } = harness();
  const barrier = Promise.withResolvers<void>();
  const first = middleware(context("first"), async () => {
    await barrier.promise;
    return { ...result, isError: true };
  });
  await middleware(context("second"), async () => ({
    ...result,
    isError: true,
  }));
  barrier.resolve();
  await first;
  assert.deepEqual(
    events.map((event: any) => event.tags["mcp.component"]),
    ["second", "first"]
  );
});
test("result getters and SDK setup failures cannot alter the operation", async () => {
  const { middleware } = harness();
  const unusual = {
    ...result,
    get resultType() {
      throw new Error("getter");
    },
  };
  assert.equal(await middleware(context(), async () => unusual), unusual);
});
test("real SDK emits spans and returned-error events without network access", async () => {
  const envelopes: unknown[] = [];
  Sentry.init({
    dsn: "https://public@example.invalid/1",
    defaultIntegrations: false,
    tracesSampleRate: 1,
    transport: () => ({
      send: async (envelope) => {
        envelopes.push(envelope);
        return { statusCode: 200 };
      },
      flush: async () => true,
    }),
  });
  const middleware = sentryMiddleware({ sentry: Sentry });
  const error = { ...result, isError: true };
  assert.equal(await middleware(context(), async () => error), error);
  await Sentry.flush();
  assert.match(JSON.stringify(envelopes), /MCP tool returned an error/);
  assert.match(JSON.stringify(envelopes), /mcp.server/);
  assert.doesNotMatch(JSON.stringify(envelopes), /private-/);
  await Sentry.close();
});
