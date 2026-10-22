import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { z } from "zod";

import middleware from "../src/middleware";
import getEmail from "../src/tools/get-email";
import sendEmail, { schema } from "../src/tools/send-email";

const originalEnv = { ...process.env };
const emailId = "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794";
const payload = {
  idempotencyKey: undefined,
  to: "delivered@resend.dev",
  subject: "Hello",
  text: "Hello from xmcp",
};

beforeEach(() => {
  mock.method(console, "error", () => {});
  process.env.RESEND_API_KEY = "re_test_only";
  process.env.RESEND_FROM = "Example <hello@example.com>";
  process.env.MCP_API_KEY = "test-mcp-key";
  // Unexpected network access fails locally; these tests never send email.
  mock.method(globalThis, "fetch", async () => {
    throw new Error("Unexpected fetch");
  });
});
afterEach(() => {
  mock.restoreAll();
  process.env = { ...originalEnv };
});

test("sends through the SDK with the server sender and idempotency header", async () => {
  const requests: Request[] = [];
  mock.method(
    globalThis,
    "fetch",
    async (input: string | URL | Request, init?: RequestInit) => {
      const request = new Request(input, init);
      requests.push(request);
      return Response.json({ id: emailId });
    }
  );
  const result = await sendEmail({
    ...payload,
    idempotencyKey: "welcome-user-123",
  });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "https://api.resend.com/emails");
  assert.equal(requests[0].method, "POST");
  assert.equal(requests[0].headers.get("authorization"), "Bearer re_test_only");
  assert.equal(requests[0].headers.get("idempotency-key"), "welcome-user-123");
  assert.deepEqual(await requests[0].json(), {
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    from: process.env.RESEND_FROM,
  });
  assert.deepEqual(JSON.parse(result.content[0].text), { id: emailId });
});

test("retrieves status without returning the email body or recipients", async () => {
  mock.method(
    globalThis,
    "fetch",
    async (input: string | URL | Request, init?: RequestInit) => {
      const request = new Request(input, init);
      assert.equal(request.url, `https://api.resend.com/emails/${emailId}`);
      assert.equal(request.method, "GET");
      return Response.json({
        id: emailId,
        subject: "Hello",
        created_at: "2026-10-22T00:00:00Z",
        last_event: "delivered",
        text: "private",
        to: ["private@example.com"],
      });
    }
  );
  const result = await getEmail({ id: emailId });
  assert.deepEqual(JSON.parse(result.content[0].text), {
    id: emailId,
    subject: "Hello",
    createdAt: "2026-10-22T00:00:00Z",
    lastEvent: "delivered",
  });
});

test("provider errors are tool errors and do not trigger retries or echo sensitive details", async () => {
  let requests = 0;
  mock.method(globalThis, "fetch", async () => {
    requests++;
    return Response.json(
      { name: "restricted_api_key", message: "sensitive provider details" },
      { status: 403 }
    );
  });
  for (const result of [
    await sendEmail(payload),
    await getEmail({ id: emailId }),
  ]) {
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /restricted_api_key/);
    assert.doesNotMatch(result.content[0].text, /sensitive provider details/);
  }
  assert.equal(requests, 2);
});

test("network failures return tool errors", async () => {
  assert.equal((await sendEmail(payload)).isError, true);
  assert.equal((await getEmail({ id: emailId })).isError, true);
});

test("configuration is required at execution, not import time", async () => {
  delete process.env.RESEND_API_KEY;
  await assert.rejects(sendEmail(payload), /Set RESEND_API_KEY/);
  process.env.RESEND_API_KEY = "re_test_only";
  delete process.env.RESEND_FROM;
  await assert.rejects(sendEmail(payload), /Set RESEND_FROM/);
});

test("input validation rejects invalid recipients and oversized idempotency keys", () => {
  assert.equal(
    z.object(schema).safeParse({ ...payload, to: "invalid" }).success,
    false
  );
  assert.equal(
    z.object(schema).safeParse({ ...payload, idempotencyKey: "x".repeat(257) })
      .success,
    false
  );
});

test("HTTP auth denies missing, invalid, and unconfigured keys before handlers", async () => {
  for (const [configured, supplied, allowed] of [
    ["test-mcp-key", "test-mcp-key", true],
    ["test-mcp-key", "invalid", false],
    ["test-mcp-key", undefined, false],
    ["", "anything", false],
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
