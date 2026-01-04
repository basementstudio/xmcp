/* eslint-disable import/no-extraneous-dependencies */
import { Readable } from "node:stream";
import { posix, sep } from "node:path";
import { pipeline } from "node:stream/promises";
import { x } from "tar";
import chalk from "chalk";

const DEFAULT_REPO = {
  username: "xmcp-dev",
  name: "templates",
  directory: "apps",
  branch: "main",
};

const EXAMPLES_URL = `https://api.github.com/repos/${DEFAULT_REPO.username}/${DEFAULT_REPO.name}`;
const EXAMPLES_CONTENTS_URL = `${EXAMPLES_URL}/contents/${DEFAULT_REPO.directory}`;

function normalizeExampleName(name: string): string {
  return name.replace(/^\/+/, "").replace(/\/+$/, "");
}

export async function isUrlOk(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.status === 200;
  } catch (err) {
    return false;
  }
}

export function existsInRepo(nameOrUrl: string): Promise<boolean> {
  const filePath = normalizeExampleName(nameOrUrl);
  if (!filePath) return Promise.resolve(false);

  const contentsUrl = `${EXAMPLES_URL}/contents/${DEFAULT_REPO.directory}/${encodeURIComponent(
    filePath
  )}?ref=${DEFAULT_REPO.branch}`;

  return isUrlOk(contentsUrl);
}

export function hasRepo(filePath: string): Promise<boolean> {
  const contentsUrl = `https://api.github.com/repos/${DEFAULT_REPO.username}/${DEFAULT_REPO.name}/contents/${DEFAULT_REPO.directory}`;
  const packagePath = `${filePath ? `/${filePath}` : ""}/package.json`;
  const fullUrl = contentsUrl + packagePath + `?ref=${DEFAULT_REPO.branch}`;

  return isUrlOk(fullUrl);
}

async function downloadTarStream(url: string) {
  const res = await fetch(url);

  if (!res.body) {
    throw new Error(`Failed to download: ${url}`);
  }

  return Readable.fromWeb(res.body as import("stream/web").ReadableStream);
}

export async function downloadAndExtractRepo(root: string, filePath: string) {
  let rootPath: string | null = null;
  const tarballUrl = `https://codeload.github.com/${DEFAULT_REPO.username}/${DEFAULT_REPO.name}/tar.gz/${DEFAULT_REPO.branch}`;

  await pipeline(
    await downloadTarStream(tarballUrl),
    x({
      cwd: root,
      strip:
        1 + // tarball root
        DEFAULT_REPO.directory.split("/").length +
        (filePath ? filePath.split("/").length : 0),
      filter: (p: string) => {
        // Convert Windows path separators to POSIX style
        const posixPath = p.split(sep).join(posix.sep);

        // Determine the unpacked root path dynamically instead of hardcoding to the fetched repo's name / branch.
        // This avoids issues when the repo is renamed or the branch changes.
        if (rootPath === null) {
          const pathSegments = posixPath.split(posix.sep);
          rootPath = pathSegments.length ? pathSegments[0] : null;
        }

        const prefix = `${rootPath}/${DEFAULT_REPO.directory}/${
          filePath ? `${filePath}/` : ""
        }`;
        const filterMatch = posixPath.startsWith(prefix);
        return filterMatch;
      },
    })
  );
}

export async function downloadAndExtractExample(root: string, name: string) {
  const filePath = normalizeExampleName(name);
  if (!filePath) {
    throw new Error(
      `Example "${name}" is not available. Only examples from ${DEFAULT_REPO.username}/${DEFAULT_REPO.name} are supported.`
    );
  }

  console.log(
    chalk.bold(`Initializing repository with template "${filePath}"`)
  );

  const exists = await hasRepo(filePath);
  if (!exists) {
    throw new Error(
      `Example "${name}" not found in ${DEFAULT_REPO.username}/${DEFAULT_REPO.name}.` +
        ` Check the template name (folder under /${DEFAULT_REPO.directory}) or list available examples.`
    );
  }

  try {
    await downloadAndExtractRepo(root, filePath);
  } catch (err) {
    throw new Error(
      `Failed to download or extract "${name}".` +
        ` This is often a network or GitHub availability issue. ` +
        `Please check your connection and retry (you can re-run the same command).` +
        (err instanceof Error && err.message ? ` Details: ${err.message}` : "")
    );
  }
}

type GitHubContentItem = {
  name: string;
  type: string;
};

async function getExamples(): Promise<string[]> {
  try {
    const res = await fetch(EXAMPLES_CONTENTS_URL, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) {
      return [];
    }

    const items: GitHubContentItem[] = await res.json();
    const names = items
      .filter((item) => item.type === "dir")
      .map((item) => item.name)
      .filter(Boolean);

    return names;
  } catch (err) {
    return [];
  }
}

export async function listExamples(): Promise<string[]> {
  const examples = await getExamples();
  console.log(chalk.bold("Available examples:"));
  examples.forEach((example) => {
    console.log(`- ${example}`);
  });
  return examples;
}
