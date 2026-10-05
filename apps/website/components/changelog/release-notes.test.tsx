import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { renderReleaseNotes } from "./release-notes";

const url = "https://github.com/basementstudio/xmcp/releases/tag/xmcp@1.1.3";

test("renders GFM notes with headings, lists, links, code, and tables", async () => {
  const html = renderToStaticMarkup(
    await renderReleaseNotes(
      [
        "# Features",
        "",
        "- First **change**",
        "- Second `change`",
        "",
        "[Pull request](https://github.com/basementstudio/xmcp/pull/1)",
        "",
        "```ts",
        "const value = '<script>';",
        "```",
        "",
        "| Version | Status |",
        "| --- | --- |",
        "| 1.1.3 | Stable |",
      ].join("\n"),
      url
    )
  );
  assert.match(html, /<h3>Features<\/h3>/);
  assert.match(html, /<ul>/);
  assert.match(html, /<strong>change<\/strong>/);
  assert.match(html, /<code>change<\/code>/);
  assert.match(
    html,
    /href="https:\/\/github.com\/basementstudio\/xmcp\/pull\/1"/
  );
  assert.match(html, /<pre><code class="language-ts">/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /<table>/);
});

test("does not execute MDX, render raw HTML, or allow unsafe URLs", async () => {
  const html = renderToStaticMarkup(
    await renderReleaseNotes(
      [
        "<script>alert('raw')</script>",
        "",
        "<img src=x onerror=alert(1)>",
        "",
        "{process.env.GITHUB_TOKEN}",
        "",
        "[unsafe](javascript:alert%281%29)",
        "",
        "[encoded](java&#x73;cript:alert%281%29)",
        "",
        "![unsafe image](data:text/html;base64,PHNjcmlwdD4=)",
        "",
        "[safe](mailto:hello@example.com)",
      ].join("\n"),
      url
    )
  );
  assert.doesNotMatch(html, /<script|onerror=|href="javascript:|src="data:/);
  assert.match(html, /\{process.env.GITHUB_TOKEN\}/);
  assert.match(html, /href="mailto:hello@example.com"/);
});
