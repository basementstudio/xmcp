import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { z } from "zod";
import middleware from "../src/middleware";
import createSession, {
  schema as createSchema,
  metadata as createMetadata,
} from "../src/tools/create-browser-session";
import getSession, {
  schema as getSchema,
} from "../src/tools/get-browser-session";
import releaseSession, {
  metadata as releaseMetadata,
} from "../src/tools/release-browser-session";

const originalEnv = { ...process.env };
const sessionId = "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794";
const session = {
  id: sessionId,
  status: "RUNNING",
  projectId: "project-id",
  expiresAt: "2026-10-23T12:05:00Z",
  keepAlive: false,
  region: "us-west-2",
};
const createInput = z.object(createSchema).parse({});
beforeEach(() => {
  process.env.BROWSERBASE_API_KEY = "test-provider-key";
  delete process.env.BROWSERBASE_PROJECT_ID;
  mock.method(globalThis, "fetch", async () => {
    throw new Error("Unexpected network access");
  });
});
afterEach(() => {
  mock.restoreAll();
  process.env = { ...originalEnv };
});

test("creation uses bounded defaults and strips connection credentials from output", async () => {
  const request = mock.method(
    globalThis,
    "fetch",
    async (url: string, init: RequestInit) => {
      assert.equal(url, "https://api.browserbase.com/v1/sessions");
      assert.equal(init.method, "POST");
      assert.equal(
        new Headers(init.headers).get("X-BB-API-Key"),
        "test-provider-key"
      );
      assert.equal(new Headers(init.headers).get("x-api-key"), null);
      assert.equal(init.redirect, "error");
      assert.ok(init.signal);
      assert.deepEqual(JSON.parse(init.body as string), {
        timeout: 300,
        keepAlive: false,
      });
      return Response.json({
        ...session,
        connectUrl: "wss://secret",
        signingKey: "secret",
        seleniumRemoteUrl: "secret",
        userMetadata: { private: true },
      });
    }
  );
  const result = await createSession(createInput);
  assert.deepEqual(JSON.parse(result.content[0].text), {
    session,
    dashboardUrl: `https://www.browserbase.com/sessions/${sessionId}`,
  });
  assert.equal(request.mock.callCount(), 1);
  assert.equal(createMetadata.annotations?.readOnlyHint, false);
  assert.equal(createMetadata.annotations?.idempotentHint, false);
});

test("creation supports an explicitly configured project and keep alive", async () => {
  process.env.BROWSERBASE_PROJECT_ID = " selected-project ";
  mock.method(globalThis, "fetch", async (_url: string, init: RequestInit) => {
    assert.deepEqual(JSON.parse(init.body as string), {
      timeout: 60,
      keepAlive: true,
      projectId: "selected-project",
    });
    return Response.json({ ...session, keepAlive: true });
  });
  assert.equal(
    JSON.parse(
      (await createSession({ timeoutSeconds: 60, keepAlive: true })).content[0]
        .text
    ).session.keepAlive,
    true
  );
});

test("reading and releasing use the session endpoint; release does not invent a completed status", async () => {
  const methods: string[] = [];
  mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    assert.equal(url, `https://api.browserbase.com/v1/sessions/${sessionId}`);
    methods.push(init.method!);
    if (init.method === "POST")
      assert.deepEqual(JSON.parse(init.body as string), {
        status: "REQUEST_RELEASE",
      });
    else assert.equal(init.body, undefined);
    return Response.json(session);
  });
  for (const tool of [getSession, releaseSession]) {
    const result = await tool({ sessionId });
    assert.equal(JSON.parse(result.content[0].text).session.status, "RUNNING");
  }
  assert.deepEqual(methods, ["GET", "POST"]);
  assert.equal(releaseMetadata.annotations?.destructiveHint, true);
});

test("HTTP failures are redacted and writes are never retried", async () => {
  let calls = 0;
  for (const status of [401, 403, 404, 429, 500]) {
    mock.method(globalThis, "fetch", async () => {
      calls++;
      return Response.json({ error: "secret" }, { status });
    });
    const result = await createSession(createInput);
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, new RegExp(`HTTP ${status}`));
    assert.match(result.content[0].text, /dashboard before retrying/);
    assert.doesNotMatch(result.content[0].text, /secret/);
  }
  assert.equal(calls, 5);
});

test("malformed and network failures preserve uncertainty without leaking secrets", async () => {
  for (const fetcher of [
    async () => Response.json({ id: sessionId }),
    async () => new Response("not json"),
    async () => {
      throw new Error("test-provider-key");
    },
  ]) {
    const request = mock.method(globalThis, "fetch", fetcher);
    const result = await releaseSession({ sessionId });
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /may have succeeded/);
    assert.doesNotMatch(result.content[0].text, /test-provider-key/);
    assert.equal(request.mock.callCount(), 1);
  }
});

test("missing credentials fail before fetch; schemas bound browser usage and reject paths", async () => {
  const request = mock.method(globalThis, "fetch", async () =>
    Response.json(session)
  );
  for (const key of ["", "   "]) {
    process.env.BROWSERBASE_API_KEY = key;
    assert.equal((await createSession(createInput)).isError, true);
  }
  assert.equal(request.mock.callCount(), 0);
  assert.deepEqual(createInput, { timeoutSeconds: 300, keepAlive: false });
  for (const timeoutSeconds of [0, 59, 3601, 60.5])
    assert.equal(
      z.object(createSchema).safeParse({ timeoutSeconds }).success,
      false
    );
  for (const id of ["../sessions", "https://example.com", ""])
    assert.equal(
      z.object(getSchema).safeParse({ sessionId: id }).success,
      false
    );
});

test("MCP authentication fails closed", async () => {
  for (const [configured, supplied, allowed] of [
    ["test-client-key", "test-client-key", true],
    ["test-client-key", "wrong", false],
    ["test-client-key", undefined, false],
    ["", "anything", false],
    ["   ", "   ", false],
  ] as const) {
    process.env.MCP_API_KEY = configured;
    let executed = false;
    let status: number | undefined;
    const response = {
      status(code: number) {
        status = code;
        return this;
      },
      json() {},
    };
    await middleware(
      { header: () => supplied } as unknown as Parameters<typeof middleware>[0],
      response as unknown as Parameters<typeof middleware>[1],
      () => {
        executed = true;
      }
    );
    assert.equal(executed, allowed);
    assert.equal(status, allowed ? undefined : 401);
  }
});
