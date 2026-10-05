import assert from "node:assert/strict";
import { test } from "node:test";
import type { Ratelimit } from "@upstash/ratelimit";
import type { McpMiddlewareResult } from "xmcp";
import { upstashRateLimit, type RateLimitContext } from "../src/index.js";

type Response = Awaited<ReturnType<Ratelimit["limit"]>>;
const success: McpMiddlewareResult = {
  content: [{ type: "text", text: "done" }],
};
const context = (signal = new AbortController().signal): RateLimitContext =>
  ({
    method: "tools/call",
    params: { name: "report", arguments: {} },
    signal,
  }) as RateLimitContext;
const response = (overrides: Partial<Response> = {}): Response => ({
  success: true,
  limit: 5,
  remaining: 4,
  reset: Date.now() + 60_000,
  pending: Promise.resolve(),
  ...overrides,
});

test("passes the verified key and weighted cost once; preserves the result", async () => {
  let checks = 0;
  let executions = 0;
  const middleware = upstashRateLimit({
    limiter: {
      limit: async (key, options) => {
        checks++;
        assert.equal(key, "customer-a");
        assert.deepEqual(options, { rate: 3 });
        return response();
      },
    },
    identifier: async () => "customer-a",
    rate: async (ctx) => (ctx.params.name === "report" ? 3 : 1),
  });
  assert.equal(
    await middleware(context(), async () => {
      executions++;
      return success;
    }),
    success
  );
  assert.equal(checks, 1);
  assert.equal(executions, 1);
});

test("other MCP operations bypass identification and quota checks", async () => {
  const middleware = upstashRateLimit({
    limiter: {
      limit: async () => {
        throw new Error("unexpected");
      },
    },
    identifier: () => {
      throw new Error("unexpected");
    },
  });
  for (const method of [
    "tools/list",
    "prompts/get",
    "resources/read",
  ] as const) {
    assert.equal(
      await middleware(
        { ...context(), method } as Parameters<typeof middleware>[0],
        async () => success
      ),
      success
    );
  }
});

for (const key of [undefined, null, "", "  "]) {
  test(`missing identity (${JSON.stringify(key)}) denies even in open mode`, async () => {
    const middleware = upstashRateLimit({
      limiter: {
        limit: async () => {
          throw new Error("unexpected");
        },
      },
      identifier: () => key,
      failureMode: "open",
    });
    const result = await middleware(context(), async () => {
      assert.fail("must not execute");
    });
    assert.equal(result.isError, true);
  });
}
for (const rate of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
  test(`invalid cost ${rate} fails before Redis`, async () => {
    const middleware = upstashRateLimit({
      limiter: {
        limit: async () => {
          assert.fail("must not consume");
        },
      },
      identifier: () => "a",
      rate,
    });
    await assert.rejects(
      async () => middleware(context(), async () => success),
      /positive safe integer/
    );
  });
}
for (const reason of [undefined, "cacheBlock", "denyList"] as const) {
  test(`quota denial ${reason} is an MCP error without secrets`, async () => {
    const reset = Date.now() + 60_000;
    const middleware = upstashRateLimit({
      limiter: {
        limit: async () =>
          response({
            success: false,
            remaining: 0,
            reset,
            reason,
            deniedValue: "private-api-key",
            pending: Promise.reject(new Error("private-backend-error")),
          }),
      },
      identifier: () => "private-customer",
      failureMode: "open",
    });
    const result = await middleware(context(), async () => {
      assert.fail("known denial must not execute");
    });
    assert.equal(result.isError, true);
    const metadata = result._meta?.["xmcp.dev/rateLimit"] as Record<
      string,
      unknown
    >;
    assert.equal(metadata.reset, reset);
    assert.equal(metadata.reason, reason === "denyList" ? "blocked" : "limit");
    assert.ok(Number(metadata.retryAfterSeconds) >= 59);
    assert.doesNotMatch(JSON.stringify(result), /private-/);
  });
}
for (const failureMode of ["closed", "open"] as const) {
  for (const failure of ["throw", "timeout", "pending"] as const) {
    test(`${failure} follows ${failureMode} failure policy`, async () => {
      const middleware = upstashRateLimit({
        limiter: {
          limit: async () => {
            if (failure === "throw")
              throw new Error("private-redis-credential");
            return response({
              reason: failure === "timeout" ? "timeout" : undefined,
              pending:
                failure === "pending"
                  ? Promise.reject(new Error("private-error"))
                  : Promise.resolve(),
            });
          },
        },
        identifier: () => "a",
        failureMode,
      });
      let calls = 0;
      const result = await middleware(context(), async () => {
        calls++;
        return success;
      });
      assert.equal(calls, failureMode === "open" ? 1 : 0);
      assert.equal(result.isError === true, failureMode === "closed");
      assert.doesNotMatch(JSON.stringify(result), /private-/);
    });
  }
}

test("settles SDK background work before execution", async () => {
  const started = Promise.withResolvers<void>();
  const pending = Promise.withResolvers<void>();
  let executed = false;
  const middleware = upstashRateLimit({
    limiter: {
      limit: async () => {
        started.resolve();
        return response({ pending: pending.promise });
      },
    },
    identifier: () => "a",
  });
  const running = middleware(context(), async () => {
    executed = true;
    return success;
  });
  await started.promise;
  assert.equal(executed, false);
  pending.resolve();
  assert.equal(await running, success);
});

for (const failureMode of ["closed", "open"] as const) {
  for (const stage of [
    "before",
    "identifier",
    "rate",
    "limit",
    "pending",
  ] as const) {
    test(`cancellation during ${stage} never executes (${failureMode})`, async () => {
      const controller = new AbortController();
      const reason = new Error("cancelled");
      const cancel = (at: string) => {
        if (stage === at) controller.abort(reason);
      };
      const middleware = upstashRateLimit({
        identifier: () => {
          cancel("identifier");
          return "a";
        },
        rate: () => {
          cancel("rate");
          return 1;
        },
        failureMode,
        limiter: {
          limit: async () => {
            cancel("limit");
            return response({
              pending: Promise.resolve().then(() => cancel("pending")),
            });
          },
        },
      });
      cancel("before");
      await assert.rejects(
        async () =>
          middleware(context(controller.signal), async () => {
            assert.fail("cancelled execution");
          }),
        (error) => error === reason
      );
    });
  }
}

test("handler errors propagate once even in open mode", async () => {
  const error = new Error("tool failed");
  let calls = 0;
  const middleware = upstashRateLimit({
    limiter: { limit: async () => response() },
    identifier: () => "a",
    failureMode: "open",
  });
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

test("concurrent customers retain their own identity and decision", async () => {
  const responses = new Map([
    ["a", Promise.withResolvers<Response>()],
    ["b", Promise.withResolvers<Response>()],
  ]);
  const seen: string[] = [];
  const middleware = upstashRateLimit({
    limiter: {
      limit: (key) => {
        seen.push(key);
        return responses.get(key)!.promise;
      },
    },
    identifier: (ctx) => ctx.params.name,
  });
  const run = (name: string) =>
    middleware(
      { ...context(), params: { name, arguments: {} } },
      async () => success
    );
  const a = run("a"),
    b = run("b");
  responses.get("b")!.resolve(response());
  assert.equal(await b, success);
  responses.get("a")!.resolve(response({ success: false }));
  assert.equal((await a).isError, true);
  assert.deepEqual(seen, ["a", "b"]);
});
