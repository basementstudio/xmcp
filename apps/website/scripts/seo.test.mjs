import assert from "node:assert/strict";
import { test } from "node:test";
import { docsSearchTitle, sitemapDate, uniqueSitemap } from "../lib/seo.ts";

test("custom docs titles are complete and whitespace falls back", () => {
  assert.equal(
    docsSearchTitle("Supabase", "Supabase Auth for MCP | xmcp"),
    "Supabase Auth for MCP | xmcp"
  );
  assert.equal(docsSearchTitle("Tools"), "Tools | xmcp Documentation");
  assert.equal(docsSearchTitle("Tools", "  "), "Tools | xmcp Documentation");
});

test("sitemap dates require a real, explicit calendar date", () => {
  for (const value of [
    undefined,
    null,
    "",
    new Date(),
    "invalid",
    "2026-02-30",
    "2026-13-01",
  ]) {
    assert.equal(sitemapDate(value), undefined);
  }
  assert.equal(sitemapDate("2024-02-29"), "2024-02-29");
  assert.equal(sitemapDate("2026-10-23"), "2026-10-23");
});

test("sitemap deduplicates without losing the content entry's date", () => {
  assert.deepEqual(
    uniqueSitemap([
      { url: "https://xmcp.dev/docs" },
      { url: "https://xmcp.dev/guides" },
      { url: "https://xmcp.dev/docs", lastModified: "2026-10-23" },
    ]),
    [
      { url: "https://xmcp.dev/docs", lastModified: "2026-10-23" },
      { url: "https://xmcp.dev/guides" },
    ]
  );
});
