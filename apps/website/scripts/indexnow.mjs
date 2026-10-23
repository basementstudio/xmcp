import { createHash, randomUUID } from "node:crypto";
import {
  appendFile,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { fromHtml } from "hast-util-from-html";

export const ORIGIN = "https://xmcp.dev";
// Public domain-verification token; the matching public/*.txt file must deploy first.
export const KEY = "78fb4b06761ad122f270142e229a307c";
export const KEY_URL = `${ORIGIN}/${KEY}.txt`;
export const ENDPOINT = "https://api.indexnow.org/indexnow";
export const SNAPSHOT_PATH = fileURLToPath(
  new URL("../.indexnow/snapshot.json", import.meta.url)
);
const SNAPSHOT_VERSION = 1;
// IndexNow's documented maximum URLs per POST.
export const BATCH_SIZE = 10_000;
// Bound network stalls and keep the production crawl modest.
const REQUEST_TIMEOUT_MS = 30_000;
const CRAWL_CONCURRENCY = 4;

function productionUrl(value) {
  const url = new URL(value);
  if (
    url.origin !== ORIGIN ||
    url.username ||
    url.password ||
    url.hash ||
    url.search
  ) {
    throw new Error(`Expected a canonical production URL: ${value}`);
  }
  return url.href;
}

function textContent(node) {
  return node.type === "text"
    ? node.value
    : (node.children ?? []).map(textContent).join("");
}

function elements(node, tagName) {
  return [
    ...(node.type === "element" && node.tagName === tagName ? [node] : []),
    ...(node.children ?? []).flatMap((child) => elements(child, tagName)),
  ];
}

export function sitemapUrls(xml) {
  // The website emits a flat Next.js urlset. Reject truncated/index responses
  // rather than mistaking a partial inventory for deleted pages.
  const body = xml.replace(/^\s*<\?xml[^?]*\?>/, "").trim();
  if (!/^<urlset\s[^>]*>/.test(body) || !body.endsWith("</urlset>")) {
    throw new Error("Expected a complete sitemap urlset");
  }
  const tree = fromHtml(body, { fragment: true });
  const roots = tree.children.filter((node) => node.type === "element");
  if (roots.length !== 1 || roots[0].tagName !== "urlset") {
    throw new Error("Invalid sitemap root");
  }
  const entries = roots[0].children.filter((node) => node.type === "element");
  const urls = entries.map((entry) => {
    const locations = elements(entry, "loc");
    if (entry.tagName !== "url" || locations.length !== 1) {
      throw new Error("Invalid sitemap URL entry");
    }
    return productionUrl(textContent(locations[0]).trim());
  });
  if (!urls.length) throw new Error("Refusing an empty sitemap");
  return [...new Set(urls)].sort();
}

function stableJson(value) {
  if (Array.isArray(value)) return value.map(stableJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stableJson(value[key])])
    );
  }
  return value;
}

const normalizeText = (value) => value.replace(/\s+/g, " ").trim();
const hasNoindex = (value = "") => /\b(?:noindex|none)\b/i.test(value);

export function pageFingerprint(html, url, robotsHeader = "") {
  const tree = fromHtml(html);
  const metadata = [];
  let noindex = hasNoindex(robotsHeader);
  const canonical = [];
  for (const meta of elements(tree, "meta")) {
    const { name, property, content, httpEquiv } = meta.properties;
    if (name || property || httpEquiv) {
      metadata.push([name ?? property ?? httpEquiv, content ?? ""]);
    }
    if (String(name).toLowerCase() === "robots") {
      noindex ||= hasNoindex(String(content ?? ""));
    }
  }
  // A retired page can set noindex and canonicalize to its replacement.
  // Its content/canonical need not remain valid for the old indexable URL.
  if (noindex) return { noindex: true, hash: null };
  for (const link of elements(tree, "link")) {
    const { rel = [], href } = link.properties;
    if (rel.includes("canonical")) canonical.push(new URL(href, url).href);
    if (rel.includes("alternate")) {
      metadata.push(["alternate", href, link.properties.hrefLang ?? ""]);
    }
  }
  if (canonical.length > 1 || (canonical.length && canonical[0] !== url)) {
    throw new Error(`Canonical URL mismatch on ${url}`);
  }
  const content = [];
  function visit(node) {
    if (node.type === "text") {
      const value = normalizeText(node.value);
      if (value) content.push(value);
      return;
    }
    if (node.type === "element") {
      const { tagName, properties: props } = node;
      if (tagName === "script") {
        if (props.type === "application/ld+json") {
          metadata.push(["jsonld", stableJson(JSON.parse(textContent(node)))]);
        }
        return;
      }
      if (["style", "svg", "template"].includes(tagName)) return;
      // Keep content-bearing attributes, never React IDs, CSS classes or nonces.
      const attributes = {
        a: ["href", "title"],
        img: ["src", "srcSet", "alt", "title"],
        video: ["src", "poster"],
        audio: ["src"],
        source: ["src", "srcSet", "type"],
      }[tagName];
      if (attributes) {
        content.push([tagName, attributes.map((name) => props[name] ?? "")]);
      }
    }
    for (const child of node.children ?? []) visit(child);
  }
  visit(tree);
  metadata.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return {
    noindex,
    hash: createHash("sha256")
      .update(JSON.stringify({ content, metadata, canonical }))
      .digest("hex"),
  };
}

export function validateSnapshot(snapshot) {
  if (
    snapshot?.version !== SNAPSHOT_VERSION ||
    snapshot.origin !== ORIGIN ||
    !snapshot.pages ||
    typeof snapshot.pages !== "object" ||
    Array.isArray(snapshot.pages)
  ) {
    throw new Error("Invalid IndexNow snapshot; restore a valid baseline");
  }
  for (const [url, hash] of Object.entries(snapshot.pages)) {
    if (productionUrl(url) !== url || !/^[a-f0-9]{64}$/.test(hash)) {
      throw new Error(`Invalid snapshot entry: ${url}`);
    }
  }
  return snapshot;
}

async function loadSnapshot(path) {
  try {
    return validateSnapshot(JSON.parse(await readFile(path, "utf8")));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function saveSnapshot(path, snapshot) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(snapshot, null, 2)}\n`);
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
}

async function mapConcurrent(values, fn) {
  let index = 0;
  const result = new Array(values.length);
  await Promise.all(
    Array.from(
      { length: Math.min(CRAWL_CONCURRENCY, values.length) },
      async () => {
        while (index < values.length) {
          const current = index++;
          result[current] = await fn(values[current]);
        }
      }
    )
  );
  return result;
}

export async function runIndexNow({
  dryRun = false,
  snapshotPath = SNAPSHOT_PATH,
  fetchImpl = fetch,
  log = console.log,
} = {}) {
  const request = (url, options = {}) =>
    fetchImpl(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      ...options,
    });
  const previous = await loadSnapshot(snapshotPath);
  if (!previous)
    log("No baseline found; all current sitemap pages will be submitted.");

  // Dry runs can inspect content before the verification file is deployed.
  if (!dryRun) {
    const response = await request(KEY_URL);
    if (response.status !== 200 || (await response.text()).trim() !== KEY) {
      throw new Error(`IndexNow key verification failed: ${KEY_URL}`);
    }
  }
  const sitemap = await request(`${ORIGIN}/sitemap.xml`);
  if (sitemap.status !== 200)
    throw new Error(`Sitemap request failed (${sitemap.status})`);
  const urls = sitemapUrls(await sitemap.text());
  const pages = {};
  const changed = [];
  const removed = [];
  const readPage = async (url, removal = false) => {
    const response = await request(url, { headers: { Accept: "text/html" } });
    if (
      removal &&
      ([404, 410].includes(response.status) ||
        ([301, 302, 303, 307, 308].includes(response.status) &&
          response.headers.has("location")))
    ) {
      return { noindex: true };
    }
    if (
      response.status !== 200 ||
      !response.headers.get("content-type")?.includes("text/html")
    ) {
      throw new Error(`Page request failed: ${url} (${response.status})`);
    }
    return pageFingerprint(
      await response.text(),
      url,
      response.headers.get("x-robots-tag") ?? ""
    );
  };
  const currentPages = await mapConcurrent(urls, async (url) => {
    const page = await readPage(url);
    if (page.noindex)
      throw new Error(`Sitemap contains a noindex page: ${url}`);
    return [url, page.hash];
  });
  for (const [url, hash] of currentPages) {
    pages[url] = hash;
    if (previous?.pages[url] !== hash) changed.push(url);
  }
  const absent = Object.keys(previous?.pages ?? {}).filter(
    (url) => !(url in pages)
  );
  const missingPages = await mapConcurrent(absent, async (url) => [
    url,
    await readPage(url, true),
  ]);
  for (const [url, page] of missingPages) {
    if (page.noindex) removed.push(url);
    else {
      // Absence from the sitemap alone does not prove deletion. Keep tracking it.
      pages[url] = page.hash;
      if (page.hash !== previous.pages[url]) changed.push(url);
    }
  }
  const urlList = [...changed, ...removed].sort();
  const summary = `${changed.length} added/changed, ${removed.length} removed, ${urlList.length} notifications`;
  if (dryRun) {
    log(`Dry run: ${summary}`);
    for (const url of urlList) log(url);
    return { changed, removed, dryRun };
  }
  for (let offset = 0; offset < urlList.length; offset += BATCH_SIZE) {
    const response = await request(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(ORIGIN).host,
        key: KEY,
        keyLocation: KEY_URL,
        urlList: urlList.slice(offset, offset + BATCH_SIZE),
      }),
    });
    if (![200, 202].includes(response.status)) {
      throw new Error(
        `IndexNow rejected submission (${response.status}); baseline unchanged`
      );
    }
    log(
      response.status === 202
        ? "IndexNow received URLs; key validation pending (202)."
        : "IndexNow received URLs (200)."
    );
  }
  await saveSnapshot(snapshotPath, {
    version: SNAPSHOT_VERSION,
    origin: ORIGIN,
    pages,
  });
  log(summary);
  return { changed, removed, dryRun };
}

export function eligibleEvent(name, event, ref) {
  if (event.repository?.full_name !== "basementstudio/xmcp") return false;
  if (name === "workflow_dispatch") return ref === "refs/heads/main";
  if (name !== "deployment_status") return false;
  const status = event.deployment_status;
  return (
    status?.state === "success" &&
    status.environment === "Production" &&
    status.creator?.login === "vercel[bot]" &&
    /^https:\/\/xmcp-website-[a-z0-9-]+\.vercel\.app\/?$/.test(
      status.environment_url ?? ""
    )
  );
}

async function main() {
  const { values } = parseArgs({
    options: {
      "dry-run": { type: "boolean", default: false },
      snapshot: { type: "string", default: SNAPSHOT_PATH },
      "github-event": { type: "boolean", default: false },
    },
  });
  if (values["github-event"]) {
    const event = JSON.parse(
      await readFile(process.env.GITHUB_EVENT_PATH, "utf8")
    );
    if (
      !eligibleEvent(
        process.env.GITHUB_EVENT_NAME,
        event,
        process.env.GITHUB_REF
      )
    ) {
      console.log("IndexNow skipped: not an eligible production event.");
      return;
    }
  }
  await runIndexNow({
    dryRun: values["dry-run"],
    snapshotPath: resolve(values.snapshot),
  });
  if (values["github-event"] && !values["dry-run"]) {
    await appendFile(process.env.GITHUB_OUTPUT, "submitted=true\n");
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
