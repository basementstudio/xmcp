import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { z } from "zod";
import { pageUrl } from "../src/firecrawl";
import middleware from "../src/middleware";
import scrapePage, { schema as scrapeSchema } from "../src/tools/scrape-page";
import extractPageSummary from "../src/tools/extract-page-summary";
import mapSite, { schema as mapSchema } from "../src/tools/map-site";

const originalEnv = { ...process.env };
const url = "https://example.com/docs";
beforeEach(() => {
  process.env.FIRECRAWL_API_KEY = "test-provider-key";
  process.env.MCP_API_KEY = "test-client-key";
  mock.method(globalThis, "fetch", async () => {
    throw new Error("Unexpected network access");
  });
});
afterEach(() => {
  mock.restoreAll();
  process.env = { ...originalEnv };
});

test("scrapes Markdown with provider-only credentials and preserves metadata", async () => {
  const payload = {
    success: true,
    data: {
      markdown: "# Example",
      metadata: {
        title: "Example",
        sourceURL: url,
        statusCode: 200,
        language: "en",
      },
    },
  };
  let calls = 0;
  mock.method(globalThis, "fetch", async (endpoint: URL, init: RequestInit) => {
    calls++;
    assert.equal(endpoint.href, "https://api.firecrawl.dev/v2/scrape");
    assert.equal(init.method, "POST");
    assert.equal(
      new Headers(init.headers).get("Authorization"),
      "Bearer test-provider-key"
    );
    assert.equal(new Headers(init.headers).get("x-api-key"), null);
    assert.equal(init.redirect, "error");
    assert.ok(init.signal);
    assert.deepEqual(JSON.parse(init.body as string), {
      url,
      onlyMainContent: false,
      formats: ["markdown"],
    });
    return Response.json(payload);
  });
  const result = await scrapePage({ url, onlyMainContent: false });
  assert.equal(calls, 1);
  assert.deepEqual(JSON.parse(result.content[0].text), payload);
});

test("extracts structured page facts with a JSON schema and permits missing facts", async () => {
  const summary = { title: null, description: null, headings: [], topics: [] };
  let calls = 0;
  mock.method(globalThis, "fetch", async (endpoint: URL, init: RequestInit) => {
    calls++;
    assert.equal(endpoint.pathname, "/v2/scrape");
    const body = JSON.parse(init.body as string);
    assert.equal(body.url, url);
    assert.equal(body.onlyMainContent, true);
    assert.equal(body.formats[0].type, "json");
    assert.deepEqual(body.formats[0].schema.required, [
      "title",
      "description",
      "headings",
      "topics",
    ]);
    assert.match(body.formats[0].prompt, /Do not invent facts/);
    return Response.json({ success: true, data: { json: summary } });
  });
  const result = await extractPageSummary({ url });
  assert.equal(calls, 1);
  assert.deepEqual(JSON.parse(result.content[0].text).data.json, summary);
});

test("maps URLs with bounded discovery options without scheduling scrapes", async () => {
  const input = { url, search: "pricing", limit: 5, includeSubdomains: true };
  const links = [{ url: "https://example.com/pricing", title: "Pricing" }];
  let calls = 0;
  mock.method(globalThis, "fetch", async (endpoint: URL, init: RequestInit) => {
    calls++;
    assert.equal(endpoint.href, "https://api.firecrawl.dev/v2/map");
    assert.deepEqual(JSON.parse(init.body as string), input);
    return Response.json({ success: true, links });
  });
  const result = await mapSite(input);
  assert.equal(calls, 1);
  assert.deepEqual(JSON.parse(result.content[0].text).links, links);
});

test("provider failures expose status and numeric retry timing without raw errors or retries", async () => {
  let calls = 0;
  const statuses = [401, 402, 403, 422, 429, 500];
  for (const status of statuses) {
    mock.method(globalThis, "fetch", async () => {
      calls++;
      return Response.json(
        { error: "private test-provider-key" },
        { status, headers: { "retry-after": "15" } }
      );
    });
    const result = await scrapePage({ url, onlyMainContent: true });
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, new RegExp(`HTTP ${status}`));
    assert.doesNotMatch(result.content[0].text, /private|test-provider-key/);
    assert.equal(
      JSON.parse(result.content[0].text).retryAfterSeconds,
      status === 429 ? 15 : undefined
    );
  }
  assert.equal(calls, statuses.length);
  mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response("", { status: 429, headers: { "retry-after": "tomorrow" } })
  );
  assert.equal(
    JSON.parse(
      (await scrapePage({ url, onlyMainContent: true })).content[0].text
    ).retryAfterSeconds,
    undefined
  );
});

test("network failures, invalid JSON, and unsuccessful or malformed payloads return tool errors", async () => {
  assert.equal(
    (await scrapePage({ url, onlyMainContent: true })).isError,
    true
  );
  for (const response of [
    new Response("not json"),
    Response.json({ success: false, error: "private" }),
    Response.json({ success: true, data: {} }),
  ]) {
    mock.method(globalThis, "fetch", async () => response);
    const result = await scrapePage({ url, onlyMainContent: true });
    assert.equal(result.isError, true);
    assert.doesNotMatch(result.content[0].text, /private/);
  }
  mock.method(globalThis, "fetch", async () =>
    Response.json({
      success: true,
      data: { json: { title: "Missing other fields" } },
    })
  );
  assert.equal((await extractPageSummary({ url })).isError, true);
  mock.method(globalThis, "fetch", async () =>
    Response.json({ success: true, links: "invalid" })
  );
  assert.equal(
    (
      await mapSite({
        url,
        search: undefined,
        limit: 20,
        includeSubdomains: false,
      })
    ).isError,
    true
  );
});

test("missing provider credentials fail before making a request", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => {
    throw new Error("Must not fetch");
  });
  delete process.env.FIRECRAWL_API_KEY;
  assert.equal(
    (await scrapePage({ url, onlyMainContent: true })).isError,
    true
  );
  process.env.FIRECRAWL_API_KEY = "   ";
  assert.equal((await extractPageSummary({ url })).isError, true);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test("schemas reject invalid URLs and discovery limits and apply defaults", () => {
  for (const invalid of [
    "not a url",
    "file:///tmp/secret",
    "ftp://example.com",
    "https://user:secret@example.com",
  ]) {
    assert.equal(pageUrl.safeParse(invalid).success, false, invalid);
  }
  assert.equal(pageUrl.safeParse("http://example.com").success, true);
  assert.equal(z.object(scrapeSchema).parse({ url }).onlyMainContent, true);
  assert.deepEqual(z.object(mapSchema).parse({ url }), {
    url,
    limit: 20,
    includeSubdomains: false,
  });
  for (const limit of [0, 101, 1.5])
    assert.equal(z.object(mapSchema).safeParse({ url, limit }).success, false);
  assert.equal(
    z.object(mapSchema).safeParse({ url, search: " " }).success,
    false
  );
  assert.equal(
    z.object(mapSchema).parse({ url, search: " pricing " }).search,
    "pricing"
  );
});

test("MCP authentication fails closed for missing, incorrect, and unconfigured keys", async () => {
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
