import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { McpMiddlewareContext } from "xmcp";
import {
  usageBilling,
  stripeMeterEvents,
  metronomeEvents,
  type UsageEvent,
} from "../src/index.js";
import { openStore } from "../../../../examples/billing-http/src/store.js";
const context = (signal = new AbortController().signal) =>
  ({
    method: "tools/call",
    params: { name: "report", arguments: { private: "secret" } },
    signal,
  }) as McpMiddlewareContext;
const result = { content: [{ type: "text" as const, text: "done" }] };
const event: UsageEvent = {
  id: "test-event",
  customerId: "customer-a",
  tool: "report",
  units: 3,
  timestamp: new Date().toISOString(),
};

test("records a durable admission before executing once, excluding arguments", async () => {
  const events: UsageEvent[] = [];
  let calls = 0;
  const middleware = usageBilling({
    customer: () => "customer-a",
    units: 3,
    admit: async (event) => {
      events.push(event);
      return true;
    },
  });
  assert.equal(
    await middleware(context(), async () => {
      assert.equal(events.length, 1);
      calls++;
      return result;
    }),
    result
  );
  assert.equal(calls, 1);
  assert.equal(events[0].units, 3);
  assert.doesNotMatch(JSON.stringify(events), /secret|arguments/);
});
for (const mode of ["no_customer", "no_credits", "store_failure"] as const)
  test(`denies ${mode} without running the tool`, async () => {
    const middleware = usageBilling({
      customer: () => (mode === "no_customer" ? undefined : "a"),
      admit: async () => {
        if (mode === "store_failure") throw new Error("private credentials");
        return false;
      },
    });
    const denied = await middleware(context(), async () => {
      assert.fail("must not execute");
    });
    assert.equal(denied.isError, true);
    assert.doesNotMatch(JSON.stringify(denied), /private credentials/);
  });
test("cancellation, failures, and input rounds preserve handler behavior", async () => {
  const controller = new AbortController();
  const middleware = usageBilling({
    customer: () => "a",
    admit: async () => {
      controller.abort();
      return true;
    },
  });
  await assert.rejects(async () =>
    middleware(context(controller.signal), async () => {
      assert.fail("cancelled");
    })
  );
  const normal = usageBilling({ customer: () => "a", admit: async () => true });
  const error = new Error("failed");
  await assert.rejects(
    async () =>
      normal(context(), async () => {
        throw error;
      }),
    (actual) => actual === error
  );
  const intermediate = { resultType: "input_required", inputRequests: {} };
  assert.equal(await normal(context(), async () => intermediate), intermediate);
});
test("discovery bypasses billing and invalid units cannot debit credits", async () => {
  const middleware = usageBilling({
    customer: () => "a",
    units: 0,
    admit: async () => {
      assert.fail("no debit");
    },
  });
  assert.equal(
    await middleware(
      { ...context(), method: "tools/list" } as McpMiddlewareContext,
      async () => result
    ),
    result
  );
  await assert.rejects(
    async () => middleware(context(), async () => result),
    /positive safe integer/
  );
});
test("SQLite commits credits and outbox together and survives reopening", async () => {
  const dir = await mkdtemp(join(tmpdir(), "xmcp-billing-"));
  const path = join(dir, "billing.sqlite");
  let store = openStore(path);
  try {
    store.grant("customer-a", 5);
    assert.equal(await store.admit(event), true);
    await assert.rejects(store.admit({ ...event, units: 1 }), /UNIQUE/);
    store.close();
    store = openStore(path);
    assert.equal(store.pending().length, 1);
    // Duplicate insert rolled back its debit: exactly two credits remain.
    assert.equal(await store.admit({ ...event, id: "second", units: 2 }), true);
    assert.equal(await store.admit({ ...event, id: "third", units: 1 }), false);
    const other = openStore(path);
    try {
      assert.equal(
        await other.admit({ ...event, id: "fourth", units: 1 }),
        false
      );
    } finally {
      other.close();
    }
    store.delivered(event.id);
    assert.deepEqual(
      store.pending().map((event) => event.id),
      ["second"]
    );
  } finally {
    store.close();
    await rm(dir, { recursive: true });
  }
});
for (const [name, provider] of [
  ["stripe", stripeMeterEvents],
  ["metronome", metronomeEvents],
] as const)
  test(`${name} delivery retries preserve IDs and sanitize provider errors`, async () => {
    const calls: { url: string; body: string; headers: Headers }[] = [];
    const send = provider({
      secretKey: "secret-key",
      eventName: "tool_attempt",
      fetch: async (url, init) => {
        calls.push({
          url: String(url),
          body: String(init?.body),
          headers: new Headers(init?.headers),
        });
        return new Response("", { status: 200 });
      },
    });
    await send(event);
    await send(event);
    assert.equal(calls[0].body, calls[1].body);
    if (name === "stripe") {
      assert.equal(calls[0].headers.get("Idempotency-Key"), event.id);
      assert.equal(
        new URLSearchParams(calls[0].body).get("payload[value]"),
        "3"
      );
    } else {
      assert.equal(JSON.parse(calls[0].body)[0].transaction_id, event.id);
      assert.equal(JSON.parse(calls[0].body)[0].properties.units, 3);
    }
    const fail = provider({
      secretKey: "secret-key",
      eventName: "tool_attempt",
      fetch: async () =>
        new Response("private-provider-error", { status: 503 }),
    });
    await assert.rejects(
      fail(event),
      (error) => error instanceof Error && !/secret|private/.test(error.message)
    );
  });
