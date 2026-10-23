import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { z } from "zod";
import middleware from "../src/middleware";
import listPullRequests, {
  schema as listSchema,
} from "../src/tools/list-pull-requests";
import getPullRequest from "../src/tools/get-pull-request";
import readFile, {
  schema as fileSchema,
} from "../src/tools/read-repository-file";

const originalEnv = { ...process.env };
const repository = { owner: "example", repo: "repo" };
const listInput = { ...repository, state: "open" as const, limit: 20, page: 1 };
const pull = {
  number: 1,
  title: "Fix docs",
  state: "open",
  html_url: "https://github.com/example/repo/pull/1",
  body: null,
  draft: false,
};
const file = {
  type: "file",
  path: "README.md",
  sha: "commit-sha",
  size: 7,
  encoding: "base64",
  content: Buffer.from("# Hello").toString("base64"),
  html_url: "https://github.com/example/repo/blob/main/README.md",
};
beforeEach(() => {
  process.env.GITHUB_TOKEN = "test-provider-key";
  mock.method(globalThis, "fetch", async () => {
    throw new Error("Unexpected network access");
  });
});
afterEach(() => {
  mock.restoreAll();
  process.env = { ...originalEnv };
});

test("lists one PR page with provider-only credentials and a next page number", async () => {
  let calls = 0;
  mock.method(globalThis, "fetch", async (url: URL, init: RequestInit) => {
    calls++;
    assert.equal(url.origin, "https://api.github.com");
    assert.equal(url.pathname, "/repos/example/repo/pulls");
    assert.equal(url.searchParams.get("per_page"), "20");
    assert.equal(url.searchParams.get("state"), "open");
    assert.equal(url.searchParams.get("page"), "1");
    const headers = new Headers(init.headers);
    assert.equal(headers.get("Authorization"), "Bearer test-provider-key");
    assert.equal(headers.get("X-GitHub-Api-Version"), "2026-03-10");
    assert.equal(headers.get("x-api-key"), null);
    assert.equal(init.redirect, "error");
    assert.ok(init.signal);
    return Response.json([pull], {
      headers: {
        link: '<https://api.github.com/repos/example/repo/pulls?page=2&per_page=20>; rel="next", <https://api.github.com/repos/example/repo/pulls?page=5>; rel="last"',
      },
    });
  });
  const result = await listPullRequests(listInput);
  assert.deepEqual(JSON.parse(result.content[0].text), {
    pullRequests: [pull],
    nextPage: 2,
  });
  assert.equal(calls, 1);
});

test("pagination does not forward external URLs and terminates when there is no next page", async () => {
  for (const link of [
    "",
    '<https://other.example/repos/example/repo/pulls?page=2>; rel="next"',
    '<https://api.github.com/other?page=2>; rel="next"',
  ]) {
    mock.method(globalThis, "fetch", async () =>
      Response.json([], { headers: { link } })
    );
    assert.equal(
      JSON.parse((await listPullRequests(listInput)).content[0].text).nextPage,
      null
    );
  }
});

test("gets PR details while preserving pending mergeability and deleted fork metadata", async () => {
  const detail = {
    ...pull,
    merged: false,
    mergeable: null,
    head: { ref: "feature", sha: "head-sha", repo: null },
    base: { ref: "main", sha: "base-sha", repo: { full_name: "example/repo" } },
  };
  mock.method(globalThis, "fetch", async (url: URL) => {
    assert.equal(url.pathname, "/repos/example/repo/pulls/1");
    return Response.json(detail);
  });
  assert.deepEqual(
    JSON.parse(
      (await getPullRequest({ ...repository, number: 1 })).content[0].text
    ),
    detail
  );
});

test("reads text by encoded path and ref without fetching returned download URLs", async () => {
  let calls = 0;
  mock.method(globalThis, "fetch", async (url: URL) => {
    calls++;
    assert.equal(
      url.pathname,
      "/repos/example/repo/contents/docs/a%20%23%3F.md"
    );
    assert.equal(url.searchParams.get("ref"), "feature/docs");
    return Response.json({
      ...file,
      content: file.content + "\n",
      download_url: "https://other.example/file",
    });
  });
  const result = await readFile({
    ...repository,
    path: "docs/a #?.md",
    ref: "feature/docs",
  });
  assert.deepEqual(JSON.parse(result.content[0].text), {
    path: file.path,
    sha: file.sha,
    url: file.html_url,
    content: "# Hello",
  });
  assert.equal(calls, 1);
});

test("rejects directories, submodules, large files, corrupt base64, and binary or invalid UTF-8 content", async () => {
  for (const payload of [
    [file],
    { ...file, type: "dir" },
    { ...file, submodule_git_url: "https://other.example/repo" },
    { ...file, size: 100001 },
    { ...file, encoding: "none", content: "" },
    { ...file, content: "%%%%" },
    { ...file, content: "AA==", size: 1 },
    { ...file, content: "/w==", size: 1 },
  ]) {
    mock.method(globalThis, "fetch", async () => Response.json(payload));
    assert.equal(
      "isError" in
        (await readFile({ ...repository, path: "README.md", ref: undefined })),
      true
    );
  }
});

test("HTTP errors and rate limits are redacted, with no automatic retry", async () => {
  let calls = 0;
  for (const status of [401, 403, 404, 429, 500]) {
    mock.method(globalThis, "fetch", async () => {
      calls++;
      return Response.json(
        { message: "private" },
        { status, headers: { "retry-after": "15" } }
      );
    });
    const result = await listPullRequests(listInput);
    assert.equal("isError" in result, true);
    assert.match(result.content[0].text, new RegExp(`HTTP ${status}`));
    assert.doesNotMatch(result.content[0].text, /private/);
    assert.equal(
      JSON.parse(result.content[0].text).retryAfterSeconds,
      status === 403 || status === 429 ? 15 : undefined
    );
  }
  assert.equal(calls, 5);
});

test("network, JSON, and shape failures return errors; absent credentials never fetch", async () => {
  assert.equal("isError" in (await listPullRequests(listInput)), true);
  for (const response of [
    new Response("invalid"),
    Response.json({ message: "unexpected" }),
  ]) {
    mock.method(globalThis, "fetch", async () => response);
    assert.equal("isError" in (await listPullRequests(listInput)), true);
  }
  const request = mock.method(globalThis, "fetch", async () => {
    throw new Error("must not fetch");
  });
  delete process.env.GITHUB_TOKEN;
  assert.equal("isError" in (await listPullRequests(listInput)), true);
  assert.equal(request.mock.callCount(), 0);
});

test("schemas reject repository and file path traversal and bound list pages", () => {
  for (const owner of ["..", ".", "a/b", "https://example.com", "a?b"])
    assert.equal(
      z.object(listSchema).safeParse({ ...repository, owner }).success,
      false
    );
  for (const path of [
    "/README.md",
    "../secret",
    "a/../b",
    "a//b",
    "a\\b",
    "a\u0000b",
  ])
    assert.equal(
      z.object(fileSchema).safeParse({ ...repository, path }).success,
      false
    );
  for (const limit of [0, 51, 1.5])
    assert.equal(
      z.object(listSchema).safeParse({ ...repository, limit }).success,
      false
    );
  assert.deepEqual(z.object(listSchema).parse(repository), listInput);
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
