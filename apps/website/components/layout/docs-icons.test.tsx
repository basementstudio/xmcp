import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { DocsPageIcon, sidebarIcons } from "./docs-icons";

test("every docs page has an intentional sidebar icon", () => {
  const directory = fileURLToPath(
    new URL("../../content/docs/", import.meta.url)
  );
  const pages = readdirSync(directory, { recursive: true }) as string[];
  for (const file of pages.filter((file) => file.endsWith(".mdx"))) {
    const slug = file.replace(/\.mdx$/, "").replace(/(^|\/)index$/, "");
    const url = `/docs${slug ? `/${slug}` : ""}`;
    assert(sidebarIcons[url], `Missing sidebar icon: ${url}`);
    assert.match(renderToStaticMarkup(<DocsPageIcon item={{ url }} />), /<svg/);
  }
});

test("unknown pages have a fallback and page-provided icons take precedence", () => {
  const unknown = renderToStaticMarkup(
    <DocsPageIcon item={{ url: "/docs/new-page" }} />
  );
  assert.match(unknown, /<svg/);
  assert.match(unknown, /aria-hidden="true"/);
  const explicit = renderToStaticMarkup(
    <DocsPageIcon
      item={{ url: "/docs", icon: <svg data-custom-icon="true" /> }}
    />
  );
  assert.match(explicit, /data-custom-icon="true"/);
  assert.equal((explicit.match(/<svg/g) ?? []).length, 1);
});

test("repeated brand icons use distinct mask IDs in desktop and mobile navigation", () => {
  const html = renderToStaticMarkup(
    <>
      <DocsPageIcon item={{ url: "/docs/integrations/commet" }} />
      <DocsPageIcon item={{ url: "/docs/integrations/commet" }} />
    </>
  );
  const ids = [...html.matchAll(/<mask id="([^"]+)"/g)].map(
    (match) => match[1]
  );
  assert.equal(ids.length, 2);
  assert.notEqual(ids[0], ids[1]);
  for (const id of ids) assert(html.includes(`mask="url(#${id})"`));
});
