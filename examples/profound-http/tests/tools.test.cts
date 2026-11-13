import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { z } from "zod";

import middleware from "../src/middleware";
import listCategories from "../src/tools/list-profound-categories";
import queryCitations from "../src/tools/query-profound-citations";
import queryVisibility, {
  schema,
} from "../src/tools/query-profound-visibility";

const originalEnv = { ...process.env };
const categoryId = "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794";
const organizationId = "88d64ea9-7b51-4e11-9535-084a1ad54931";
const input = {
  categoryId,
  dates: { start: "2026-10-01", end: "2026-10-07" },
  scope: "owned" as const,
  groupBy: [],
  interval: "day" as const,
  limit: 10,
  cursor: undefined,
};
beforeEach(() => {
  process.env.PROFOUND_API_KEY = "test-provider-key";
  process.env.MCP_API_KEY = "test-client-key";
  mock.method(globalThis, "fetch", async () => {
    throw new Error("Unexpected network access");
  });
});
afterEach(() => {
  mock.restoreAll();
  process.env = { ...originalEnv };
});

test("lists categories with repeated organization filters and provider-only credentials", async () => {
  const categories = [
    { id: categoryId, name: "Demo", organization_id: organizationId },
  ];
  mock.method(globalThis, "fetch", async (url: URL, init: RequestInit) => {
    assert.equal(url.origin, "https://api.tryprofound.com");
    assert.equal(url.pathname, "/v1/org/categories");
    assert.deepEqual(url.searchParams.getAll("organization_ids"), [
      organizationId,
      categoryId,
    ]);
    assert.equal(init.method, "GET");
    assert.equal(
      new Headers(init.headers).get("X-API-Key"),
      "test-provider-key"
    );
    assert.equal(init.redirect, "error");
    assert.ok(init.signal);
    return Response.json(categories);
  });
  const result = await listCategories({
    organizationIds: [organizationId, categoryId],
  });
  assert.deepEqual(JSON.parse(result.content[0].text), categories);
});

test("maps visibility inputs to v2 fields and preserves metrics and cursors", async () => {
  const report = {
    info: { next_cursor: "next-page", count: 1 },
    data: [{ asset: { name: "Example" }, visibility_score: 0.48 }],
  };
  mock.method(globalThis, "fetch", async (url: URL, init: RequestInit) => {
    assert.equal(url.pathname, "/v2/reports/visibility");
    assert.equal(init.method, "POST");
    assert.deepEqual(JSON.parse(init.body as string), {
      category_id: categoryId,
      start_date: input.dates.start,
      end_date: input.dates.end,
      scope: "owned",
      group_by: [],
      interval: "day",
      limit: 10,
      assets: ["Example"],
      cursor: "current-page",
    });
    return Response.json(report);
  });
  const result = await queryVisibility({
    ...input,
    assets: ["Example"],
    cursor: "current-page",
  });
  assert.deepEqual(JSON.parse(result.content[0].text), report);
});

test("queries domain citations without borrowing visibility-only fields", async () => {
  mock.method(globalThis, "fetch", async (url: URL, init: RequestInit) => {
    assert.equal(url.pathname, "/v2/reports/citations");
    const body = JSON.parse(init.body as string);
    assert.equal(body.entity, "domain");
    assert.equal(body.scope, "owned");
    assert.equal(body.assets, undefined);
    return Response.json({ info: { next_cursor: null }, data: [] });
  });
  assert.equal((await queryCitations(input)).isError, undefined);
});

test("errors expose status and retry timing without raw provider data or automatic retries", async () => {
  let calls = 0;
  for (const status of [401, 403, 422, 429, 500]) {
    mock.method(globalThis, "fetch", async () => {
      calls++;
      return Response.json(
        { detail: "private provider data" },
        { status, headers: { "retry-after": "15" } }
      );
    });
    const result = await queryCitations(input);
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, new RegExp(`HTTP ${status}`));
    assert.doesNotMatch(result.content[0].text, /private provider data/);
    assert.equal(
      JSON.parse(result.content[0].text).retryAfterSeconds,
      status === 429 ? 15 : undefined
    );
  }
  assert.equal(calls, 5);
});

test("network failures and malformed responses become tool errors; absent keys fail before fetch", async () => {
  assert.equal((await queryCitations(input)).isError, true);
  mock.method(globalThis, "fetch", async () => new Response("not json"));
  assert.equal((await queryCitations(input)).isError, true);
  delete process.env.PROFOUND_API_KEY;
  await assert.rejects(queryCitations(input), /Set PROFOUND_API_KEY/);
});

test("schemas validate real calendar dates, date order, limits, and defaults", () => {
  const parse = (value: unknown) => z.object(schema).safeParse(value);
  assert.equal(
    parse({ ...input, dates: { start: "2026-02-30", end: "2026-03-01" } })
      .success,
    false
  );
  assert.equal(
    parse({ ...input, dates: { start: "2026-10-08", end: "2026-10-07" } })
      .success,
    false
  );
  assert.equal(parse({ ...input, limit: 51 }).success, false);
  const defaults = z.object(schema).parse({ categoryId, dates: input.dates });
  assert.equal(defaults.limit, 10);
  assert.equal(defaults.scope, "owned");
});

test("MCP authentication fails closed for absent, incorrect, or unconfigured keys", async () => {
  for (const [configured, supplied, allowed] of [
    ["test-client-key", "test-client-key", true],
    ["test-client-key", "wrong", false],
    ["test-client-key", undefined, false],
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
