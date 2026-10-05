import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  fetchReleases,
  normalizeReleases,
  writeReleaseSnapshot,
} from "./fetch-releases.mjs";

function release(tag, overrides = {}) {
  return {
    tag_name: tag,
    draft: false,
    prerelease: false,
    published_at: "2026-09-03T20:24:09Z",
    html_url: `https://github.com/basementstudio/xmcp/releases/tag/${tag}`,
    body: "### Patch Changes\n\n- A fix.",
    ...overrides,
  };
}

test("keeps stable framework releases, legacy tags, and empty notes", () => {
  const result = normalizeReleases([
    release("xmcp@1.1.3"),
    release("v0.6.13", { body: null }),
    release("xmcp@1.1.2", { body: "" }),
    release("xmcp@1.2.0", { draft: true }),
    release("v1.3.0", { prerelease: true }),
    release("xmcp@1.4.0-canary.1"),
    release("v1.4.0-alpha.1"),
    release("@xmcp-dev/compiler@1.1.3"),
    release("create-xmcp-app@1.1.3"),
  ]);
  assert.deepEqual(
    result.map((item) => item.version),
    ["1.1.3", "0.6.13", "1.1.2"]
  );
  assert.equal(result[1].body, "");
  assert.equal(result[2].body, "");
  assert.equal(result[0].body, "### Patch Changes\n\n- A fix.");
});

test("follows pagination, passes authentication, and orders by publication date", async () => {
  const next =
    "https://api.github.com/repos/basementstudio/xmcp/releases?per_page=100&page=2";
  const requests = [];
  const result = await fetchReleases({
    token: "test-token",
    fetchImpl: async (url, options) => {
      requests.push(url);
      assert.equal(options.headers.Authorization, "Bearer test-token");
      return requests.length === 1
        ? new Response(
            JSON.stringify([
              release("v0.6.13", { published_at: "2025-01-01T00:00:00Z" }),
            ]),
            { headers: { link: `<${next}>; rel="next"` } }
          )
        : new Response(JSON.stringify([release("xmcp@1.1.3")]));
    },
  });
  assert.equal(requests.length, 2);
  assert.equal(requests[1], next);
  assert.deepEqual(
    result.map((item) => item.version),
    ["1.1.3", "0.6.13"]
  );
});

test("rejects unsuccessful responses, malformed data, and an empty history", async () => {
  for (const response of [
    new Response("rate limited", { status: 403 }),
    new Response("upstream failed", { status: 503 }),
    new Response("not json"),
    Response.json({ message: "unexpected" }),
    Response.json([release("xmcp@1.1.3", { published_at: "invalid" })]),
    Response.json([release("xmcp@1.1.3", { body: 123 })]),
    Response.json([release("xmcp@1.1.3", { html_url: "javascript:alert(1)" })]),
    Response.json([]),
  ]) {
    await assert.rejects(fetchReleases({ fetchImpl: async () => response }));
  }
  await assert.rejects(
    fetchReleases({
      fetchImpl: async () => {
        throw new Error("offline");
      },
    }),
    /offline/
  );
});

test("accepts GitHub's numeric repository pagination URL", async () => {
  const next = "https://api.github.com/repositories/985096937/releases?page=2";
  const requests = [];
  const releases = await fetchReleases({
    fetchImpl: async (url) => {
      requests.push(url);
      return Response.json([release(`xmcp@1.1.${requests.length}`)], {
        headers: requests.length === 1 ? { link: `<${next}>; rel="next"` } : {},
      });
    },
  });
  assert.equal(requests[1], next);
  assert.equal(releases.length, 2);
});

test("rejects pagination for other repositories and repeated URLs", async () => {
  for (const url of [
    "https://api.github.com/repositories/123/releases?page=2",
    "https://api.github.com/repos/other/repository/releases?page=2",
    "https://api.github.com/repos/basementstudio/xmcp/releases?per_page=100",
  ]) {
    let requests = 0;
    await assert.rejects(
      fetchReleases({
        fetchImpl: async () => {
          requests++;
          return Response.json([release("xmcp@1.1.3")], {
            headers: { link: `<${url}>; rel="next"` },
          });
        },
      }),
      /(?:Unexpected|Repeated) GitHub pagination URL/
    );
    assert.equal(requests, 1);
  }
});

test("rejects external pagination before forwarding credentials", async () => {
  let requests = 0;
  await assert.rejects(
    fetchReleases({
      fetchImpl: async () => {
        requests++;
        return Response.json([release("xmcp@1.1.3")], {
          headers: { link: '<https://example.com/>; rel="next"' },
        });
      },
    }),
    /Unexpected GitHub pagination/
  );
  assert.equal(requests, 1);
});

test("refresh replaces the snapshot and failure removes it instead of keeping stale releases", async () => {
  const directory = await mkdtemp(join(tmpdir(), "xmcp-releases-"));
  const outputPath = join(directory, "releases.json");
  try {
    for (const version of ["1.1.2", "1.1.3"]) {
      await writeReleaseSnapshot({
        outputPath,
        fetchImpl: async () => Response.json([release(`xmcp@${version}`)]),
      });
      assert.equal(
        JSON.parse(await readFile(outputPath, "utf8"))[0].version,
        version
      );
    }
    await assert.rejects(
      writeReleaseSnapshot({
        outputPath,
        fetchImpl: async () => {
          throw new Error("offline");
        },
      }),
      /offline/
    );
    await assert.rejects(readFile(outputPath), { code: "ENOENT" });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
