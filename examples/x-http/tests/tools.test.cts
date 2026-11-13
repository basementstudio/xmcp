import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { z } from "zod";
import middleware from "../src/middleware";
import profile from "../src/tools/get-x-profile";
import mentions, {
  schema as mentionsSchema,
} from "../src/tools/list-x-mentions";
import publish, {
  schema as publishSchema,
  metadata,
} from "../src/tools/publish-x-post";
const originalEnv = { ...process.env };
const user = { id: "123", name: "Example", username: "example" };
const post = { id: "1844674407370955161", text: "Hello" };
const parsed = (result: { content: { text: string }[] }) =>
  JSON.parse(result.content[0].text);
beforeEach(() => {
  process.env.X_USER_ACCESS_TOKEN = "test-provider-key";
  mock.method(globalThis, "fetch", async () => {
    throw new Error("Unexpected request");
  });
});
afterEach(() => {
  mock.restoreAll();
  process.env = { ...originalEnv };
});

test("profile uses OAuth user authentication, fixed origin, and allowlisted output", async () => {
  mock.method(globalThis, "fetch", async (url: URL, init: RequestInit) => {
    assert.equal(String(url), "https://api.x.com/2/users/me");
    assert.equal(init.method, "GET");
    assert.equal(
      new Headers(init.headers).get("Authorization"),
      "Bearer test-provider-key"
    );
    assert.equal(new Headers(init.headers).get("x-api-key"), null);
    assert.equal(init.redirect, "error");
    assert.ok(init.signal);
    return Response.json({ data: { ...user, private_field: "secret" } });
  });
  assert.deepEqual(parsed(await profile()), { user });
});

test("mentions resolves account on each operation, preserves string IDs and opaque cursors", async () => {
  let accountReads = 0;
  let pageReads = 0;
  mock.method(globalThis, "fetch", async (url: URL) => {
    if (url.pathname.endsWith("/me"))
      return Response.json({ data: { ...user, id: String(++accountReads) } });
    pageReads++;
    assert.equal(url.pathname, `/2/users/${pageReads}/mentions`);
    assert.equal(url.searchParams.get("max_results"), "5");
    assert.equal(url.searchParams.get("pagination_token"), "opaque+cursor");
    assert.equal(url.searchParams.get("since_id"), post.id);
    assert.equal(url.searchParams.get("tweet.fields"), "author_id,created_at");
    return Response.json({
      data: [post],
      meta: { result_count: 1, next_token: "next", newest_id: post.id },
    });
  });
  for (let index = 1; index <= 2; index++)
    assert.deepEqual(
      parsed(
        await mentions({ limit: 5, after: "opaque+cursor", sinceId: post.id })
      ),
      {
        user: { ...user, id: String(index) },
        mentions: [post],
        nextToken: "next",
        newestId: post.id,
      }
    );
  assert.equal(accountReads, 2);
  assert.equal(pageReads, 2);
});

test("empty mentions succeeds but partial API errors and missing data fail", async () => {
  let payload: unknown = { meta: { result_count: 0 } };
  mock.method(globalThis, "fetch", async (url: URL) =>
    Response.json(url.pathname.endsWith("/me") ? { data: user } : payload)
  );
  const input = {
    ...z.object(mentionsSchema).parse({}),
    after: undefined,
    sinceId: undefined,
  };
  assert.deepEqual(parsed(await mentions(input)), {
    user,
    mentions: [],
    nextToken: null,
    newestId: null,
  });
  for (const value of [
    { meta: { result_count: 1 } },
    { data: [post], meta: { result_count: 1 }, errors: [{ detail: "secret" }] },
  ]) {
    payload = value;
    const result = await mentions(input);
    assert.equal(result.isError, true);
    assert.doesNotMatch(result.content[0].text, /secret/);
  }
});

test("publication and replies send only approved text and declare a non-idempotent write", async () => {
  const bodies: unknown[] = [];
  mock.method(globalThis, "fetch", async (url: URL, init: RequestInit) => {
    assert.equal(String(url), "https://api.x.com/2/tweets");
    assert.equal(init.method, "POST");
    bodies.push(JSON.parse(init.body as string));
    return Response.json({ data: post });
  });
  for (const replyToId of [undefined, "999"])
    assert.deepEqual(parsed(await publish({ text: "Hello", replyToId })), {
      post,
      url: `https://x.com/i/status/${post.id}`,
    });
  assert.deepEqual(bodies, [
    { text: "Hello" },
    { text: "Hello", reply: { in_reply_to_tweet_id: "999" } },
  ]);
  assert.equal(metadata.annotations?.readOnlyHint, false);
  assert.equal(metadata.annotations?.idempotentHint, false);
});

test("HTTP errors and uncertain writes are redacted without automatic retries", async () => {
  let calls = 0;
  for (const status of [401, 403, 429, 500]) {
    mock.method(globalThis, "fetch", async () => {
      calls++;
      return Response.json({ detail: "secret" }, { status });
    });
    const result = await publish({ text: "Hello", replyToId: undefined });
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, new RegExp(`HTTP ${status}`));
    assert.match(result.content[0].text, /already be published/);
    assert.doesNotMatch(result.content[0].text, /secret/);
  }
  mock.method(globalThis, "fetch", async () => {
    calls++;
    throw new Error("test-provider-key");
  });
  const result = await publish({ text: "Hello", replyToId: undefined });
  assert.equal(result.isError, true);
  assert.doesNotMatch(result.content[0].text, /test-provider-key/);
  assert.match(result.content[0].text, /already be published/);
  assert.equal(calls, 5);
});

test("malformed success responses and partial errors do not confirm publication", async () => {
  for (const body of [
    "not JSON",
    JSON.stringify({}),
    JSON.stringify({ data: post, errors: [{ detail: "secret" }] }),
  ]) {
    mock.method(globalThis, "fetch", async () => new Response(body));
    const result = await publish({ text: "Hello", replyToId: undefined });
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /already be published/);
    assert.doesNotMatch(result.content[0].text, /secret/);
  }
});

test("missing tokens fail before requests and input schemas constrain posts and pagination", async () => {
  delete process.env.X_USER_ACCESS_TOKEN;
  const request = mock.method(globalThis, "fetch", async () =>
    Response.json({ data: user })
  );
  assert.equal((await profile()).isError, true);
  assert.equal(request.mock.callCount(), 0);
  for (const text of [" ", "x".repeat(281)])
    assert.equal(z.object(publishSchema).safeParse({ text }).success, false);
  assert.equal(
    z.object(publishSchema).safeParse({ text: "Hello", replyToId: "../me" })
      .success,
    false
  );
  assert.equal(z.object(mentionsSchema).parse({}).limit, 20);
  for (const limit of [4, 51, 5.5])
    assert.equal(z.object(mentionsSchema).safeParse({ limit }).success, false);
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
