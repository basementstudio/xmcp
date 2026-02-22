export async function getRepoStars(repoUrl: string): Promise<string> {
  try {
    // Extract owner/repo from GitHub URL
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      return "0";
    }

    const [, owner, repo] = match;
    const cleanRepo = repo.replace(/\.git$/, ""); // Remove .git suffix if present

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

export type ExampleItem = {
  slug: string;
  name: string;
  description: string;
  repositoryUrl: string;
  path: string;
  category?: string;
  tags?: string[];
  websiteUrl?: string;
  demoUrl?: string;
  deployUrl?: string;
  preview?: string;
  previewUrl?: string;
  readmePath?: string;
};

export const BRANCH = "feat/add-meta-json-config";
const REPO_URL = "https://api.github.com/repos/xmcp-dev/templates/contents";
const REPO_TREE_URL = "https://github.com/xmcp-dev/templates/tree";

type TemplateMeta = {
  slug?: string;
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
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

function buildContentUrl(path: string) {
  const trimmed = path.replace(/^\/+/, "");
  return `${REPO_URL}/${trimmed}?ref=${BRANCH}`;
}

async function fetchFileContent(path: string): Promise<string | null> {
  try {
    const url = buildContentUrl(path);
    console.log("[examples] fetch content", url);

    const res = await fetch(url, {
      headers: getGitHubHeaders(),
      cache: "force-cache",
    });

    if (!res.ok) {
      console.error(
        "[examples] non-ok content fetch",
        url,
        "status",
        res.status,
        res.statusText
      );
      return null;
    }

    const content = await res.json();
    const decoded = Buffer.from(content.content, "base64").toString("utf-8");
    return decoded;
  } catch (error) {
    console.error(`Error fetching content at ${path}:`, error);
    return null;
  }
}

async function fetchJsonFile<T = unknown>(path: string): Promise<T | null> {
  try {
    const url = buildContentUrl(path);
    console.log("[examples] fetch json", url);

    const res = await fetch(url, {
      headers: getGitHubHeaders(),
      cache: "force-cache",
    });

    if (!res.ok) {
      console.error(
        "[examples] non-ok json fetch",
        url,
        "status",
        res.status,
        res.statusText
      );
      return null;
    }

    const content = await res.json();
    const decoded = Buffer.from(content.content, "base64").toString("utf-8");
    return JSON.parse(decoded) as T;
  } catch (error) {
    console.error(`Error fetching JSON file at ${path}:`, error);
    return null;
  }
}

async function findPreviewPath(dirName: string): Promise<string | undefined> {
  const extensions = ["png", "webp", "jpg", "jpeg"];

  for (const ext of extensions) {
    try {
      const relativePath = `${dirName}/.config/preview.${ext}`;
      const url = buildContentUrl(relativePath);
      console.log("[examples] check preview", url);

      const res = await fetch(url, {
        headers: getGitHubHeaders(),
        cache: "force-cache",
      });

      if (res.ok) {
        // Return repo-relative path so the site can construct URLs as needed
        return relativePath;
      }
    } catch (error) {
      console.error(
        `Error checking preview image ${dirName}/.config/preview.${ext}:`,
        error
      );
    }
  }

  return undefined;
}

export async function fetchExamples(): Promise<ExampleItem[]> {
  try {
    const listUrl = `${REPO_URL}?ref=${BRANCH}`;
    console.log("[examples] fetching directory list", listUrl);

    const response = await fetch(listUrl, {
      headers: getGitHubHeaders(),
      cache: "force-cache",
    });

    if (!response.ok) {
      console.error("Failed to fetch examples directory");
      return [];
    }

    const contents = await response.json();
    console.log(
      "[examples] contents response status",
      response.status,
      "items",
      Array.isArray(contents) ? contents.length : typeof contents
    );

    const directories = contents.filter(
      (item: { type: string; name: string }) =>
        item.type === "dir" &&
        item.name !== ".vscode" &&
        item.name !== ".config"
    );
    console.log(
      "[examples] directories",
      directories.map((d: { name: string }) => d.name).join(", ")
    );

    const examples = await Promise.all(
      directories.map(async (dir: { name: string; path: string }) => {
        try {
          console.log("[examples] processing dir", dir.name);

          const [meta, preview] = await Promise.all([
            fetchJsonFile<TemplateMeta>(
              `${dir.name}/.config/template.meta.json`
            ),
            findPreviewPath(dir.name),
          ]);

          // Require metadata to surface the template so debugging missing files is straightforward
          if (!meta) {
            console.error(
              `Missing .config/template.meta.json for ${dir.name}; skipping entry.`
            );
            return null;
          }

          console.log(
            `[examples] meta for ${dir.name}`,
            JSON.stringify(meta, null, 2),
            "preview",
            preview ?? "none"
          );

          const previewUrl = preview
            ? `https://raw.githubusercontent.com/xmcp-dev/templates/${BRANCH}/${preview}`
            : undefined;

          return {
            // Slug should mirror the folder name so routes stay aligned with template dirs
            slug: dir.name,
            name: meta.name ?? dir.name,
            description: meta.description ?? `Example: ${dir.name}`,
            repositoryUrl: `${REPO_TREE_URL}/${BRANCH}/${dir.name}`,
            path: dir.path,
            category: meta.category,
            tags: meta.tags ?? [],
            websiteUrl: meta.websiteUrl ?? meta.website,
            demoUrl: meta.demoUrl ?? meta.demo,
            deployUrl: meta.deployUrl ?? meta.deploy,
            preview,
            previewUrl,
            readmePath: meta.readme?.path,
          };
        } catch (error) {
          console.error(
            `Error fetching template metadata for ${dir.name}:`,
            error
          );
          return null;
        }
      })
    );

    const filtered = examples.filter(
      (example): example is ExampleItem => example !== null
    );

    console.log(
      `[examples] fetched ${filtered.length} templates`,
      filtered.map((ex) => ex.slug || ex.name).join(", ")
    );

    return filtered;
  } catch (error) {
    console.error("Error fetching examples:", error);
    return [];
  }
}

export async function fetchExample(slug: string): Promise<ExampleItem | null> {
  const examples = await fetchExamples();
  return examples.find((example) => example.slug === slug) ?? null;
}

export async function fetchExampleReadme(
  example: ExampleItem
): Promise<string | null> {
  const normalizedPath = example.readmePath
    ? `${example.path.replace(/^\/+/, "")}/${example.readmePath.replace(
        /^\/+/,
        ""
      )}`
    : `${example.path.replace(/^\/+/, "")}/README.md`;

  return fetchFileContent(normalizedPath);
}

function getGitHubHeaders() {
  const headers: Record<string, string> = {
    "User-Agent": "request",
  };

  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

// formatter: 1000 => 1k, etc
function kFormatter(num: number): string {
  return Math.abs(num) > 999
    ? (Math.sign(num) * (Math.abs(num) / 1000)).toFixed(1) + "k"
    : (Math.sign(num) * Math.abs(num)).toString();
}

