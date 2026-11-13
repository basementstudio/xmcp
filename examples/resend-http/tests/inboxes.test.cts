import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { z } from "zod";
import createInbox from "../src/tools/create-inbox";
import getInbox from "../src/tools/get-inbox";
import listInboxes, { schema as listSchema } from "../src/tools/list-inboxes";
import listThreads from "../src/tools/list-inbox-threads";
import getThread from "../src/tools/get-inbox-thread";
import listEmails from "../src/tools/list-inbox-emails";
import createDraft from "../src/tools/create-inbox-reply-draft";
import getDraft from "../src/tools/get-inbox-draft";
import sendDraft from "../src/tools/send-inbox-draft";
import reply, { schema as replySchema } from "../src/tools/reply-inbox-email";

const originalEnv = { ...process.env };
const inboxId = "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794";
const threadId = "b3e2b2b6-3f0e-4c8e-9ad3-2f43a1e2c7f1";
const emailId = "c3e2b2b6-3f0e-4c8e-9ad3-2f43a1e2c7f1";
const draftId = "d3e2b2b6-3f0e-4c8e-9ad3-2f43a1e2c7f1";
const thread = { inboxId, threadId };
const page = { limit: 20, after: undefined };
let requests: Request[];
let providerData: unknown;
beforeEach(() => {
  mock.method(console, "error", () => {});
  process.env.RESEND_API_KEY = "re_mock_only";
  delete process.env.RESEND_FROM;
  requests = [];
  providerData = { id: inboxId };
  mock.method(
    globalThis,
    "fetch",
    async (input: string | URL | Request, init?: RequestInit) => {
      const request = new Request(input, init);
      assert.equal(request.headers.get("authorization"), "Bearer re_mock_only");
      requests.push(request);
      return Response.json(providerData);
    }
  );
});
afterEach(() => {
  mock.restoreAll();
  process.env = { ...originalEnv };
});

function assertRequest(path: string, method = "GET") {
  assert.equal(requests.at(-1)!.url, `https://api.resend.com${path}`);
  assert.equal(requests.at(-1)!.method, method);
}

test("creates and retrieves inboxes without requiring RESEND_FROM", async () => {
  await createInbox({
    emailAddress: "support@example.com",
    name: "Support",
    fromName: "Support team",
    forwarding: true,
  });
  assertRequest("/inboxes", "POST");
  assert.deepEqual(await requests[0].json(), {
    email_address: "support@example.com",
    name: "Support",
    from_name: "Support team",
    forwarding: true,
  });
  await getInbox({ inboxId });
  assertRequest(`/inboxes/${inboxId}`);
  assert.equal(requests.length, 2);
});

test("lists inboxes with forward pagination and preserves has_more", async () => {
  providerData = { object: "list", data: [{ id: inboxId }], has_more: true };
  const result = await listInboxes({ limit: 10, after: inboxId });
  const url = new URL(requests[0].url);
  assert.equal(url.pathname, "/inboxes");
  assert.equal(url.searchParams.get("limit"), "10");
  assert.equal(url.searchParams.get("after"), inboxId);
  assert.deepEqual(JSON.parse(result.content[0].text), providerData);
  assert.equal(requests.length, 1);
});

test("filters threads and reads the selected thread summary", async () => {
  await listThreads({
    inboxId,
    ...page,
    folders: ["inbox", "archive"],
    read: false,
  });
  const url = new URL(requests[0].url);
  assert.equal(url.pathname, `/inboxes/${inboxId}/threads`);
  assert.equal(url.searchParams.get("folders"), "inbox,archive");
  assert.equal(url.searchParams.get("read"), "false");
  await getThread(thread);
  assertRequest(`/inboxes/${inboxId}/threads/${threadId}`);
});

test("reads paginated message bodies and recipients without executing their content", async () => {
  providerData = {
    object: "list",
    has_more: true,
    data: [
      {
        id: emailId,
        text: "Untrusted email content",
        html: "<p>Hello</p>",
        to: ["support@example.com"],
      },
    ],
  };
  const result = await listEmails({ ...thread, limit: 1, after: emailId });
  const url = new URL(requests[0].url);
  assert.equal(url.pathname, `/inboxes/${inboxId}/threads/${threadId}/emails`);
  assert.equal(url.searchParams.get("after"), emailId);
  assert.equal(url.searchParams.get("limit"), "1");
  assert.deepEqual(JSON.parse(result.content[0].text), providerData);
  assert.equal(requests.length, 1);
});

test("creates a reply draft with idempotency and retrieves it without sending", async () => {
  providerData = { object: "inbox_draft", id: draftId };
  await createDraft({
    ...thread,
    replyToEmailId: emailId,
    text: "A proposed reply",
    idempotencyKey: "draft-1",
  });
  assertRequest(`/inboxes/${inboxId}/drafts`, "POST");
  assert.equal(requests[0].headers.get("idempotency-key"), "draft-1");
  assert.deepEqual(await requests[0].json(), {
    thread_id: threadId,
    reply_to_email_id: emailId,
    text: "A proposed reply",
  });
  providerData = {
    id: draftId,
    text: "Existing draft text",
    to: ["sender@example.com"],
  };
  const result = await getDraft({ inboxId, draftId });
  assertRequest(`/inboxes/${inboxId}/drafts/${draftId}`);
  assert.deepEqual(JSON.parse(result.content[0].text), providerData);
  assert.equal(requests.length, 2);
});

test("only explicit send or reply tools send messages and forward idempotency keys", async () => {
  await sendDraft({ inboxId, draftId, idempotencyKey: "send-1" });
  assertRequest(`/inboxes/${inboxId}/drafts/${draftId}/send`, "POST");
  assert.equal(requests[0].headers.get("idempotency-key"), "send-1");
  await reply({
    ...thread,
    emailId,
    text: "Confirmed reply",
    replyAll: false,
    idempotencyKey: "reply-1",
  });
  assertRequest(
    `/inboxes/${inboxId}/threads/${threadId}/emails/${emailId}/reply`,
    "POST"
  );
  assert.deepEqual(await requests[1].json(), {
    text: "Confirmed reply",
    reply_all: false,
  });
  assert.equal(requests[1].headers.get("idempotency-key"), "reply-1");
  assert.equal(requests.length, 2);
});

test("provider rejection and network failure become tool errors without retries or private details", async () => {
  for (const failure of ["permission", "network"]) {
    let calls = 0;
    mock.method(globalThis, "fetch", async () => {
      calls++;
      if (failure === "network") throw new Error("private transport details");
      return Response.json(
        { name: "restricted_api_key", message: "private account details" },
        { status: 403 }
      );
    });
    for (const result of [
      await listInboxes(page),
      await reply({
        ...thread,
        emailId,
        text: "Reply",
        replyAll: false,
        idempotencyKey: "retry-safe",
      }),
    ]) {
      assert.equal(result.isError, true);
      assert.doesNotMatch(result.content[0].text, /private|re_mock_only/);
    }
    assert.equal(calls, 2);
  }
});

test("requires credentials only when executing and validates IDs, limits, and reply inputs", async () => {
  delete process.env.RESEND_API_KEY;
  await assert.rejects(listInboxes(page), /Set RESEND_API_KEY/);
  assert.equal(requests.length, 0);
  for (const input of [{ limit: 0 }, { limit: 101 }, { after: "../other" }]) {
    assert.equal(z.object(listSchema).safeParse(input).success, false);
  }
  const base = { ...thread, emailId, text: "Reply" };
  assert.equal(z.object(replySchema).parse(base).replyAll, false);
  for (const input of [
    { ...base, text: "" },
    { ...base, inboxId: "../other" },
    { ...base, idempotencyKey: "x".repeat(257) },
  ]) {
    assert.equal(z.object(replySchema).safeParse(input).success, false);
  }
});
