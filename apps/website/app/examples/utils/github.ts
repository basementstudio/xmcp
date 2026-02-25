export type ExampleKind = "example" | "template";

export type ExampleItem = {
  kind: ExampleKind;
  slug: string;
  name: string;
  description: string;
  repositoryUrl: string;
  path: string;
  sourceRepo: string;
  sourceBranch: string;
  category?: string;
  tags?: string[];
  websiteUrl?: string;
  demoUrl?: string;
  deployUrl?: string;
  preview?: string;
  previewUrl?: string;
  readmePath?: string;
};

export const BRANCH = "main";

const XMCP_REPO = "basementstudio/xmcp";
const XMCP_BRANCH = "main";
const TEMPLATES_REPO = "xmcp-dev/templates";
const TEMPLATES_BRANCH = BRANCH;

type RepoContentItem = {
  type: "file" | "dir";
  name: string;
  path: string;
  content?: string;
};

type PackageMeta = {
  name?: string;
  description?: string;
  keywords?: string[];
  homepage?: string;
  demoUrl?: string;
  deployUrl?: string;
  readmePath?: string;
};

type TemplateMeta = {
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
  tag?: string;
  websiteUrl?: string;
  demoUrl?: string;
  deployUrl?: string;
  website?: string;
  demo?: string;
  deploy?: string;
  readme?: {
    path?: string;
  };
};

function buildApiContentsUrl(repo: string, path = "", ref = "main") {
  const trimmed = path.replace(/^\/+/, "");
  const suffix = trimmed.length > 0 ? `/${trimmed}` : "";
  return `https://api.github.com/repos/${repo}/contents${suffix}?ref=${ref}`;
}

function buildTreeUrl(repo: string, path = "", ref = "main") {
  const trimmed = path.replace(/^\/+/, "");
  const suffix = trimmed.length > 0 ? `/${trimmed}` : "";
  return `https://github.com/${repo}/tree/${ref}${suffix}`;
}

function buildRawUrl(repo: string, path: string, ref = "main") {
  const trimmed = path.replace(/^\/+/, "");
  return `https://raw.githubusercontent.com/${repo}/${ref}/${trimmed}`;
}

async function fetchRepoContents(
  repo: string,
  path = "",
  ref = "main"
): Promise<RepoContentItem[] | null> {
  try {
    const response = await fetch(buildApiContentsUrl(repo, path, ref), {
      headers: getGitHubHeaders(),
      cache: "force-cache",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as RepoContentItem[];
    return Array.isArray(data) ? data : null;
  } catch (error) {
    console.error(`Error fetching directory ${repo}/${path}:`, error);
    return null;
  }
}

async function fetchRepoFileJson<T = unknown>(
  repo: string,
  path: string,
  ref = "main"
): Promise<T | null> {
  try {
    const response = await fetch(buildApiContentsUrl(repo, path, ref), {
      headers: getGitHubHeaders(),
      cache: "force-cache",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as RepoContentItem;
    if (!data.content) {
      return null;
    }

    const decoded = Buffer.from(data.content, "base64").toString("utf-8");
    return JSON.parse(decoded) as T;
  } catch (error) {
    console.error(`Error fetching JSON ${repo}/${path}:`, error);
    return null;
  }
}

async function fetchRepoFileText(
  repo: string,
  path: string,
  ref = "main"
): Promise<string | null> {
  try {
    const response = await fetch(buildApiContentsUrl(repo, path, ref), {
      headers: getGitHubHeaders(),
      cache: "force-cache",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as RepoContentItem;
    if (!data.content) {
      return null;
    }

    return Buffer.from(data.content, "base64").toString("utf-8");
  } catch (error) {
    console.error(`Error fetching text ${repo}/${path}:`, error);
    return null;
  }
}

async function findPreviewPath(
  repo: string,
  templateSlug: string,
  ref = "main"
): Promise<string | undefined> {
  const extensions = ["png", "webp", "jpg", "jpeg"];

  for (const ext of extensions) {
    const candidate = `${templateSlug}/.config/preview.${ext}`;
    try {
      const response = await fetch(buildApiContentsUrl(repo, candidate, ref), {
        headers: getGitHubHeaders(),
        cache: "force-cache",
      });

      if (response.ok) {
        return candidate;
      }
    } catch (error) {
      console.error(`Error checking preview ${repo}/${candidate}:`, error);
    }
  }

  return undefined;
}

async function fetchRepoExamples(): Promise<ExampleItem[]> {
  const contents = await fetchRepoContents(XMCP_REPO, "examples", XMCP_BRANCH);

  if (!contents) {
    return [];
  }

  const directories = contents.filter((item) => item.type === "dir");

  const examples = await Promise.all(
    directories.map(async (dir) => {
      const packageMeta = await fetchRepoFileJson<PackageMeta>(
        XMCP_REPO,
        `examples/${dir.name}/package.json`,
        XMCP_BRANCH
      );

      return {
        kind: "example" as const,
        slug: dir.name,
        name: packageMeta?.name ?? dir.name,
        description: packageMeta?.description ?? `Example: ${dir.name}`,
        repositoryUrl: buildTreeUrl(XMCP_REPO, `examples/${dir.name}`, XMCP_BRANCH),
        path: dir.path,
        sourceRepo: XMCP_REPO,
        sourceBranch: XMCP_BRANCH,
        category: "example",
        tags: packageMeta?.keywords ?? [],
        websiteUrl: packageMeta?.homepage,
        demoUrl: packageMeta?.demoUrl,
        deployUrl: packageMeta?.deployUrl,
        readmePath: packageMeta?.readmePath,
      };
    })
  );

  return examples;
}

async function fetchTemplates(): Promise<ExampleItem[]> {
  const contents = await fetchRepoContents(TEMPLATES_REPO, "", TEMPLATES_BRANCH);

  if (!contents) {
    return [];
  }

  const directories = contents.filter(
    (item) =>
      item.type === "dir" && item.name !== ".vscode" && item.name !== ".config"
  );

  const templates = await Promise.all(
    directories.map(async (dir) => {
      const [meta, preview] = await Promise.all([
        fetchRepoFileJson<TemplateMeta>(
          TEMPLATES_REPO,
          `${dir.name}/.config/template.meta.json`,
          TEMPLATES_BRANCH
        ),
        findPreviewPath(TEMPLATES_REPO, dir.name, TEMPLATES_BRANCH),
      ]);

      const tags = Array.from(
        new Set([...(meta?.tags ?? []), meta?.tag].filter(Boolean))
      ) as string[];

      return {
        kind: "template" as const,
        slug: dir.name,
        name: meta?.name ?? dir.name,
        description: meta?.description ?? dir.name,
        repositoryUrl: buildTreeUrl(TEMPLATES_REPO, dir.name, TEMPLATES_BRANCH),
        path: dir.path,
        sourceRepo: TEMPLATES_REPO,
        sourceBranch: TEMPLATES_BRANCH,
        category: meta?.category,
        tags,
        websiteUrl: meta?.websiteUrl ?? meta?.website,
        demoUrl: meta?.demoUrl ?? meta?.demo,
        deployUrl: meta?.deployUrl ?? meta?.deploy,
        preview,
        previewUrl: preview
          ? buildRawUrl(TEMPLATES_REPO, preview, TEMPLATES_BRANCH)
          : undefined,
        readmePath: meta?.readme?.path,
      };
    })
  );

  return templates;
}

export async function fetchExamplesAndTemplates(): Promise<ExampleItem[]> {
  const [examples, templates] = await Promise.all([
    fetchRepoExamples(),
    fetchTemplates(),
  ]);

  return [...examples, ...templates];
}

export async function fetchExample(
  kind: ExampleKind,
  slug: string
): Promise<ExampleItem | null> {
  const items = await fetchExamplesAndTemplates();
  return items.find((item) => item.kind === kind && item.slug === slug) ?? null;
}

export async function fetchExampleBySlug(
  slug: string
): Promise<ExampleItem | null> {
  const items = await fetchExamplesAndTemplates();
  const matches = items.filter((item) => item.slug === slug);

  if (matches.length !== 1) {
    return null;
  }

  return matches[0] ?? null;
}

export async function fetchExampleReadme(
  example: ExampleItem
): Promise<string | null> {
  const basePath = example.path.replace(/^\/+/, "");
  const normalizedPath = example.readmePath
    ? `${basePath}/${example.readmePath.replace(/^\/+/, "")}`
    : `${basePath}/README.md`;

  return fetchRepoFileText(
    example.sourceRepo,
    normalizedPath,
    example.sourceBranch
  );
}

export async function getRepoStars(repoUrl: string): Promise<string> {
  try {
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      return "0";
    }

    const [, owner, repo] = match;
    const cleanRepo = repo.replace(/\.git$/, "");

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${cleanRepo}`,
      {
        headers: getGitHubHeaders(),
      }
    );

    if (!response.ok) {
      return "0";
    }

    const { stargazers_count } = await response.json();
    return kFormatter(stargazers_count);
  } catch (error) {
    console.error("Error fetching GitHub stars:", error);
    return "0";
  }
}

function getGitHubHeaders() {
  const headers: Record<string, string> = {
    "User-Agent": "request",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

function kFormatter(num: number): string {
  return Math.abs(num) > 999
    ? (Math.sign(num) * (Math.abs(num) / 1000)).toFixed(1) + "k"
    : (Math.sign(num) * Math.abs(num)).toString();
}
