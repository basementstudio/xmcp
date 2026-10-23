// Run against `next start`, or set SEO_BASE_URL to a deployed preview.
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";

const base = process.env.SEO_BASE_URL ?? "http://localhost:3100";
const canonicalOrigin = "https://xmcp.dev";
const normalize = (url) => {
  const parsed = new URL(url, canonicalOrigin);
  return parsed.pathname.replace(/\/$/, "") || "/";
};
const attrs = (tag) =>
  Object.fromEntries(
    [...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map((match) => [
      match[1],
      match[2],
    ])
  );
const get = (path, headers) => fetch(`${base}${path}`, { headers });
const sitemapResponse = await get("/sitemap.xml");
assert.equal(sitemapResponse.status, 200);
const xml = await sitemapResponse.text();
const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
assert.equal(new Set(urls).size, urls.length, "duplicate sitemap URLs");
assert(urls.every((url) => url.startsWith(`${canonicalOrigin}/`)));
const paths = new Set(urls.map(normalize));
assert(paths.has("/guides"));
assert(paths.has("/docs/integrations"));
assert(!paths.has("/terminal"));
for (const entry of xml.matchAll(/<url>(.*?)<\/url>/gs)) {
  const path = normalize(entry[1].match(/<loc>(.*?)<\/loc>/)[1]);
  if (
    [
      "/",
      "/docs",
      "/guides",
      "/blog",
      "/templates",
      "/faq",
      "/showcase",
      "/telemetry",
      "/changelog",
    ].includes(path)
  ) {
    assert(
      !entry[1].includes("<lastmod>"),
      `invented collection date: ${path}`
    );
  }
}

async function contentFiles(directory, suffix) {
  const entries = await readdir(new URL(directory, import.meta.url), {
    recursive: true,
    withFileTypes: true,
  });
  return entries.filter(
    (entry) => entry.isFile() && entry.name.endsWith(suffix)
  );
}
const docs = await contentFiles("../content/docs/", ".mdx");
for (const file of docs) {
  const root = new URL("../content/docs/", import.meta.url).pathname;
  const slug = `${file.parentPath}/${file.name}`
    .slice(root.length)
    .replace(/\.mdx$/, "")
    .replace(/(^|\/)index$/, "");
  assert(paths.has(normalize(`/docs/${slug}`)), `missing doc: ${slug}`);
}
const guides = [];
for (const file of await contentFiles("../content/blog/", ".mdx")) {
  const content = await readFile(`${file.parentPath}/${file.name}`, "utf8");
  const path = `/blog/${file.name.slice(0, -4)}`;
  assert(paths.has(path), `missing article: ${path}`);
  const category = content.match(/^category: ["']?([^"'\n]+)["']?$/m)?.[1];
  if (category !== "engineering" && category !== "changelog") guides.push(path);
}
const graph = new Map();
const titles = new Set();
const descriptions = new Set();
const broken = [];
const breadcrumbTargets = new Set();
for (const path of paths) {
  const response = await get(path);
  assert.equal(response.status, 200, path);
  assert(!/noindex/i.test(response.headers.get("x-robots-tag") ?? ""), path);
  const html = await response.text();
  const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
  assert(title && !titles.has(title), `missing or duplicate title: ${path}`);
  titles.add(title);
  const tags = [...html.matchAll(/<(?:link|meta)\s[^>]*>/g)].map((match) =>
    attrs(match[0])
  );
  const canonical = tags.find((tag) => tag.rel === "canonical")?.href;
  assert.equal(
    canonical?.replace(/\/$/, ""),
    `${canonicalOrigin}${path}`.replace(/\/$/, ""),
    path
  );
  const description = tags.find((tag) => tag.name === "description")?.content;
  assert(
    description && !descriptions.has(description),
    `missing or duplicate description: ${path}`
  );
  descriptions.add(description);
  assert(
    !tags.some(
      (tag) =>
        ["robots", "googlebot"].includes(tag.name) &&
        /noindex/i.test(tag.content)
    ),
    path
  );
  assert(/<h1[\s>]/.test(html), `missing heading: ${path}`);
  const links = [...html.matchAll(/<a\s[^>]*>/g)]
    .map((match) => attrs(match[0]).href)
    .filter(Boolean);
  graph.set(
    path,
    new Set(
      links
        .filter(
          (link) =>
            (link.startsWith("/") && !link.startsWith("//")) ||
            link.startsWith(`${canonicalOrigin}/`)
        )
        .map(normalize)
    )
  );
  for (const script of html.matchAll(
    /<script type="application\/ld\+json">(.*?)<\/script>/gs
  )) {
    const parsed = JSON.parse(script[1]);
    for (const schema of Array.isArray(parsed) ? parsed : [parsed]) {
      if (schema["@type"] === "BreadcrumbList") {
        for (const item of schema.itemListElement)
          breadcrumbTargets.add(normalize(item.item));
      }
    }
  }
}
const depths = new Map([["/", 0]]);
for (const [path, depth] of depths) {
  for (const link of graph.get(path) ?? []) {
    if (paths.has(link) && !depths.has(link)) depths.set(link, depth + 1);
  }
}
for (const path of paths)
  assert(depths.has(path), `unreachable from homepage: ${path}`);
for (const path of guides) {
  assert(graph.get("/guides").has(path), `missing guide hub link: ${path}`);
  assert(depths.get(path) <= 2, `guide deeper than two links: ${path}`);
}
for (const path of paths) {
  if (path.startsWith("/docs/integrations/"))
    assert(
      graph.get("/docs/integrations").has(path),
      `missing integration link: ${path}`
    );
}
// Include stale section links, not just sitemap URLs, in the crawl.
for (const path of new Set(
  [...graph.values()]
    .flatMap((links) => [...links])
    .concat([...breadcrumbTargets])
)) {
  if (
    !paths.has(path) &&
    !path.includes(".") &&
    !path.startsWith("/api/") &&
    path !== "/mcp"
  ) {
    const response = await get(path);
    if (response.status >= 400) broken.push(`${path}: ${response.status}`);
  }
}
assert.deepEqual(broken, [], "broken internal links or breadcrumbs");
for (const [path, target] of [
  ["/guides.md", "/guides"],
  ["/docs/integrations.md", "/docs/integrations"],
  ...[...paths]
    .filter((path) => path.startsWith("/docs/integrations/"))
    .map((path) => [`${path}.md`, path]),
]) {
  const response = await get(path);
  assert.equal(response.status, 200, path);
  assert.equal(
    response.headers.get("link"),
    `<${canonicalOrigin}${target}>; rel="canonical"`
  );
  const markdown = await response.text();
  assert(markdown.startsWith("#"));
  if (path === "/docs/integrations.md") {
    for (const integration of paths)
      if (integration.startsWith("/docs/integrations/"))
        assert(markdown.includes(integration), integration);
  }
}
const negotiated = await get("/guides", { Accept: "text/markdown" });
assert(negotiated.headers.get("content-type")?.includes("text/markdown"));
assert.equal((await get("/this-page-does-not-exist-seo-check")).status, 404);
assert.equal(
  (await get("/docs/this-page-does-not-exist-seo-check")).status,
  404
);
assert(/noindex/.test(await (await get("/terminal")).text()));

// The directory index is exposed at its canonical route, not an /index alias.
assert.equal((await get("/docs/integrations/index")).status, 404);
assert(
  (await (await get("/docs/integrations")).text()).includes(
    "<title>MCP Server Integrations for TypeScript | xmcp</title>"
  )
);
const oldComparison = await get("/blog/xmcp-vs-fastmcp-vs-mcp-sdk");
assert.equal(new URL(oldComparison.url).pathname, "/blog/xmcp-v1");

// Search and AI retrieval share the same public content and discovery indexes.
const robots = await (await get("/robots.txt")).text();
assert(/User-Agent: \*/i.test(robots));
assert(/^Allow: \/$/m.test(robots));
assert(!/^Disallow:\s*\S/m.test(robots));
assert(robots.includes(`${canonicalOrigin}/sitemap.xml`));
const discovery = await (await get("/llms.txt")).text();
const fullText = await (await get("/llms-full.txt")).text();
for (const path of paths) {
  if (
    path === "/guides" ||
    path.startsWith("/docs") ||
    path.startsWith("/blog/")
  )
    assert(
      discovery.includes(`](${path})`),
      `missing text discovery link: ${path}`
    );
  if (path.startsWith("/docs") || path.startsWith("/blog/"))
    assert(
      fullText.includes(`(${path})`),
      `missing full-text content: ${path}`
    );
}
for (const agent of [
  "Googlebot",
  "bingbot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "Claude-SearchBot",
  "Claude-User",
  "xmcp-public-retrieval-check",
]) {
  const response = await get("/guides", { "User-Agent": agent });
  assert.equal(response.status, 200, agent);
  assert((await response.text()).includes("MCP guides"), agent);
}

console.log(
  `SEO crawl passed: ${paths.size} pages, ${guides.length} guides within two links, complete integrations and Markdown mirrors.`
);
