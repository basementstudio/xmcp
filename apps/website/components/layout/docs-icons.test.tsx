import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

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

test("each docs page has a distinct icon shape", () => {
  const shapes = new Map<string, string>();
  for (const [url, Icon] of Object.entries(sidebarIcons)) {
    assert(Icon);
    const html = renderToStaticMarkup(<Icon />);
    // Compare geometry, not component names: aliases can render the same glyph.
    const shape = (
      html.match(
        /<(?:path|rect|circle|line|polyline|polygon|ellipse)\b[^>]*>/g
      ) ?? []
    ).join("");
    assert(shape, `Missing icon geometry: ${url}`);
    assert(
      !shapes.has(shape),
      `${url} repeats the icon for ${shapes.get(shape)}`
    );
    shapes.set(shape, url);
  }
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
