import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RELEASES_URL =
  "https://api.github.com/repos/basementstudio/xmcp/releases";
// GitHub also emits pagination links using this repository's immutable ID.
const RELEASES_PATHS = new Set([
  new URL(RELEASES_URL).pathname,
  "/repositories/985096937/releases",
]);
const SNAPSHOT_PATH = fileURLToPath(
  new URL("../.generated/releases.json", import.meta.url)
);
// Bound each GitHub request so an unavailable upstream cannot hang a deploy.
const REQUEST_TIMEOUT_MS = 30_000;
const STABLE_TAG = /^(?:xmcp@|v)(\d+\.\d+\.\d+)$/;

export function normalizeReleases(data) {
  if (!Array.isArray(data)) throw new Error("Expected a GitHub releases array");

  return data.flatMap((release) => {
    if (
      !release ||
      typeof release.tag_name !== "string" ||
      typeof release.draft !== "boolean" ||
      typeof release.prerelease !== "boolean"
    ) {
      throw new Error("Malformed GitHub release");
    }
    const match = STABLE_TAG.exec(release.tag_name);
    if (!match || release.draft || release.prerelease) return [];
    if (
      typeof release.published_at !== "string" ||
      !Number.isFinite(Date.parse(release.published_at)) ||
      typeof release.html_url !== "string" ||
      !release.html_url.startsWith(
        "https://github.com/basementstudio/xmcp/releases/tag/"
      ) ||
      (release.body !== null && typeof release.body !== "string")
    ) {
      throw new Error(`Malformed GitHub release: ${release.tag_name}`);
    }
    return [
      {
        version: match[1],
        publishedAt: release.published_at,
        body: release.body ?? "",
        url: release.html_url,
      },
    ];
  });
}

export async function fetchReleases({
  fetchImpl = fetch,
  token = process.env.GITHUB_TOKEN,
} = {}) {
  const releases = [];
  let url = `${RELEASES_URL}?per_page=100`;
  const visited = new Set();
  while (url) {
    if (visited.has(url)) throw new Error("Repeated GitHub pagination URL");
    visited.add(url);
    const response = await fetchImpl(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok)
      throw new Error(`GitHub releases request failed (${response.status})`);
    releases.push(...normalizeReleases(await response.json()));
    const next = response.headers.get("link")?.match(/<([^>]+)>;\s*rel="next"/);
    url = next?.[1] ?? "";
    if (url) {
      const nextUrl = new URL(url);
      if (
        nextUrl.origin !== "https://api.github.com" ||
        !RELEASES_PATHS.has(nextUrl.pathname)
      ) {
        throw new Error("Unexpected GitHub pagination URL");
      }
    }
  }
  if (!releases.length)
    throw new Error("GitHub returned no stable xmcp releases");
  return releases.sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)
  );
}

export async function writeReleaseSnapshot({
  outputPath = SNAPSHOT_PATH,
  ...options
} = {}) {
  // Remove the previous snapshot first: a failed refresh must never reuse it.
  await rm(outputPath, { force: true });
  const releases = await fetchReleases(options);
  await mkdir(dirname(outputPath), { recursive: true });
  const temporaryPath = `${outputPath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(releases, null, 2)}\n`);
  await rename(temporaryPath, outputPath);
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await writeReleaseSnapshot().catch((error) => {
    console.error(`Unable to refresh changelog: ${error.message}`);
    process.exitCode = 1;
  });
}
