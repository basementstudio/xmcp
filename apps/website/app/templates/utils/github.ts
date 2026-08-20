import { TEMPLATES_REVALIDATE_SECONDS } from "./constants";

export type TemplateItem = {
  slug: string;
  name: string;
  description: string;
  repositoryUrl: string;
  path: string;
  sourceRepo: string;
  sourceBranch: string;
  category?: string;
  tags?: string[];
  primaryFilterTag?: string;
  metadataKeywords?: string[];
  websiteUrl?: string;
  demoUrl?: string;
  deployUrl?: string;
  replitUrl?: string;
  preview?: string;
  previewUrl?: string;
  readmePath?: string;
};

export const BRANCH = "main";

const TEMPLATES_REPO = "xmcp-dev/templates";
const TEMPLATES_BRANCH = BRANCH;

type RepoContentItem = {
  type: "file" | "dir";
  name: string;
  path: string;
  content?: string;
};

type TemplateMeta = {
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
  tag?: string;
  image?: string;
  preview?: string;
  previewImage?: string;
  websiteUrl?: string;
  demoUrl?: string;
  deployUrl?: string;
  website?: string;
  demo?: string;
  deploy?: string;
  replitUrl?: string;
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
      next: { revalidate: TEMPLATES_REVALIDATE_SECONDS },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as RepoContentItem[];
    return Array.isArray(data) ? data : null;
  } catch {
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
      next: { revalidate: TEMPLATES_REVALIDATE_SECONDS },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as RepoContentItem;
    if (!data.content) return null;

    const decoded = Buffer.from(data.content, "base64").toString("utf-8");
    return JSON.parse(decoded) as T;
  } catch {
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
      next: { revalidate: TEMPLATES_REVALIDATE_SECONDS },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as RepoContentItem;
    if (!data.content) return null;

    return Buffer.from(data.content, "base64").toString("utf-8");
  } catch {
    return null;
  }
}

async function fetchRawFileText(
  repo: string,
  path: string,
  ref = "main"
): Promise<string | null> {
  try {
    const response = await fetch(buildRawUrl(repo, path, ref), {
      next: { revalidate: TEMPLATES_REVALIDATE_SECONDS },
    });

    if (!response.ok) return null;

    return await response.text();
  } catch {
    return null;
  }
}

async function findPreviewPath(
  repo: string,
  templateSlug: string,
  ref = "main"
): Promise<string | undefined> {
  const extensions = ["png", "webp", "jpg", "jpeg"];

  try {
    return await Promise.any(
      extensions.map(async (ext) => {
        const candidate = `${templateSlug}/.config/preview.${ext}`;
        const response = await fetch(
          buildApiContentsUrl(repo, candidate, ref),
          {
            headers: getGitHubHeaders(),
            next: { revalidate: TEMPLATES_REVALIDATE_SECONDS },
          }
        );
        if (!response.ok) throw new Error("not found");
        return candidate;
      })
    );
  } catch {
    return undefined;
  }
}

function isAbsoluteUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function resolveTemplateImageUrl(
  repo: string,
  templateSlug: string,
  ref: string,
  meta?: TemplateMeta | null
) {
  const candidate = [meta?.image, meta?.preview, meta?.previewImage]
    .find((value) => typeof value === "string" && value.trim().length > 0)
    ?.trim();

  if (!candidate) {
    return undefined;
  }

  if (isAbsoluteUrl(candidate)) {
    return candidate;
  }

  if (candidate.startsWith("/")) {
    return buildRawUrl(repo, candidate, ref);
  }

  return buildRawUrl(repo, `${templateSlug}/${candidate}`, ref);
}

export async function fetchTemplates(): Promise<TemplateItem[]> {
  const contents = await fetchRepoContents(
    TEMPLATES_REPO,
    "",
    TEMPLATES_BRANCH
  );

  if (!contents) {
    return [];
  }

  const directories = contents.filter(
    (item) =>
      item.type === "dir" && item.name !== ".vscode" && item.name !== ".config"
  );

  const templates = await Promise.all(
    directories.map(async (dir) => {
      const [meta, previewPath] = await Promise.all([
        fetchRepoFileJson<TemplateMeta>(
          TEMPLATES_REPO,
          `${dir.name}/.config/template.meta.json`,
          TEMPLATES_BRANCH
        ),
        findPreviewPath(TEMPLATES_REPO, dir.name, TEMPLATES_BRANCH),
      ]);
      const metaImageUrl = resolveTemplateImageUrl(
        TEMPLATES_REPO,
        dir.name,
        TEMPLATES_BRANCH,
        meta
      );

      const tags = Array.from(
        new Set([...(meta?.tags ?? []), meta?.tag].filter(Boolean))
      ) as string[];
      const metadataKeywords = Array.from(
        new Set([meta?.category, ...tags].filter(Boolean))
      ) as string[];
      const primaryFilterTag = meta?.category ?? tags[0];

      const item: TemplateItem = {
        slug: dir.name,
        name: meta?.name ?? dir.name,
        description: meta?.description ?? dir.name,
        repositoryUrl: buildTreeUrl(TEMPLATES_REPO, dir.name, TEMPLATES_BRANCH),
        path: dir.path,
        sourceRepo: TEMPLATES_REPO,
        sourceBranch: TEMPLATES_BRANCH,
        category: meta?.category,
        tags,
        primaryFilterTag,
        metadataKeywords,
        websiteUrl: meta?.websiteUrl ?? meta?.website,
        demoUrl: meta?.demoUrl ?? meta?.demo,
        deployUrl: meta?.deployUrl ?? meta?.deploy,
        replitUrl: meta?.replitUrl,
        preview: previewPath,
        previewUrl: metaImageUrl
          ? metaImageUrl
          : previewPath
            ? buildRawUrl(TEMPLATES_REPO, previewPath, TEMPLATES_BRANCH)
            : undefined,
        readmePath: meta?.readme?.path,
      };

      return item;
    })
  );

  return templates;
}

export async function fetchTemplateBySlug(
  slug: string
): Promise<TemplateItem | null> {
  const items = await fetchTemplates();
  return items.find((item) => item.slug === slug) ?? null;
}

export async function fetchTemplateReadme(
  template: TemplateItem
): Promise<string | null> {
  const basePath = template.path.replace(/^\/+/, "");
  const configuredPath = template.readmePath
    ? `${basePath}/${template.readmePath.replace(/^\/+/, "")}`
    : undefined;
  const defaultReadmePath = `${basePath}/README.md`;

  const candidatePaths = Array.from(
    new Set([configuredPath, defaultReadmePath].filter(Boolean))
  ) as string[];

  try {
    return await Promise.any(
      candidatePaths.flatMap((path) => [
        fetchRepoFileText(
          template.sourceRepo,
          path,
          template.sourceBranch
        ).then((result) => {
          if (!result) throw new Error("not found");
          return result;
        }),
        fetchRawFileText(template.sourceRepo, path, template.sourceBranch).then(
          (result) => {
            if (!result) throw new Error("not found");
            return result;
          }
        ),
      ])
    );
  } catch {
    return null;
  }
}

export async function getRepoStars(repoUrl: string): Promise<string> {
  try {
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/?\#]+)/);
    if (!match) return "0";

    const [, owner, repo] = match;
    const cleanRepo = repo.replace(/\.git$/, "");

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${cleanRepo}`,
      {
        headers: getGitHubHeaders(),
        next: { revalidate: TEMPLATES_REVALIDATE_SECONDS },
      }
    );

    if (!response.ok) return "0";

    const { stargazers_count } = await response.json();
    return kFormatter(stargazers_count);
  } catch {
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
