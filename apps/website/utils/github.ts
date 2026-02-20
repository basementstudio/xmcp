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
  name: string;
  description: string;
  repositoryUrl: string;
  path: string;
  tags?: string[];
  kind: "example" | "template";
  sourceRepo?: string;
};

export async function fetchExamples(): Promise<ExampleItem[]> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/basementstudio/xmcp/contents/examples`,
      {
        headers: getGitHubHeaders(),
        cache: "force-cache",
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch examples directory");
      return [];
    }

    const contents = await response.json();

    const directories = contents.filter(
      (item: { type: string }) => item.type === "dir"
    );

    const examples = await Promise.all(
      directories.map(async (dir: { name: string; path: string }) => {
        try {
          const packageResponse = await fetch(
            `https://api.github.com/repos/basementstudio/xmcp/contents/examples/${dir.name}/package.json`,
            {
              headers: getGitHubHeaders(),
              cache: "force-cache",
            }
          );

          if (!packageResponse.ok) {
            return {
              name: dir.name,
              description: `Example: ${dir.name}`,
              repositoryUrl: `https://github.com/basementstudio/xmcp/tree/main/examples/${dir.name}`,
              path: dir.path,
              tags: [],
              kind: "example",
              sourceRepo: "basementstudio/xmcp",
            };
          }

          const packageData = await packageResponse.json();
          const packageContent = JSON.parse(
            Buffer.from(packageData.content, "base64").toString("utf-8")
          );

          return {
            name: packageContent.name || dir.name,
            description: packageContent.description || `Example: ${dir.name}`,
            repositoryUrl: `https://github.com/basementstudio/xmcp/tree/main/examples/${dir.name}`,
            path: dir.path,
            tags: packageContent.keywords || [],
            kind: "example",
            sourceRepo: "basementstudio/xmcp",
          };
        } catch (error) {
          console.error(`Error fetching package.json for ${dir.name}:`, error);
          return {
            name: dir.name,
            description: `Example: ${dir.name}`,
            repositoryUrl: `https://github.com/basementstudio/xmcp/tree/main/examples/${dir.name}`,
            path: dir.path,
            tags: [],
            kind: "example",
            sourceRepo: "basementstudio/xmcp",
          };
        }
      })
    );

    return examples;
  } catch (error) {
    console.error("Error fetching examples:", error);
    return [];
  }
}

type TemplateMeta = {
  name?: string;
  description?: string;
  category?: string;
  tag?: string;
};

export async function fetchTemplates(): Promise<ExampleItem[]> {
  const templatesRepo = "xmcp-dev/templates";

  try {
    const response = await fetch(
      `https://api.github.com/repos/${templatesRepo}/contents`,
      {
        headers: getGitHubHeaders(),
        cache: "force-cache",
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch templates directory");
      return [];
    }

    const contents = await response.json();
    const directories = contents.filter(
      (item: { type: string }) => item.type === "dir"
    );

    const templates = await Promise.all(
      directories.map(async (dir: { name: string; path: string }) => {
        const repositoryUrl = `https://github.com/${templatesRepo}/tree/main/${dir.name}`;

        try {
          const metaResponse = await fetch(
            `https://api.github.com/repos/${templatesRepo}/contents/${dir.name}/.config/template.meta.json`,
            {
              headers: getGitHubHeaders(),
              cache: "force-cache",
            }
          );

          if (!metaResponse.ok) {
            return {
              name: dir.name,
              description: `Template: ${dir.name}`,
              repositoryUrl,
              path: dir.path,
              tags: [],
              kind: "template",
              sourceRepo: templatesRepo,
            };
          }

          const metaData = await metaResponse.json();
          const metaContent = JSON.parse(
            Buffer.from(metaData.content, "base64").toString("utf-8")
          ) as TemplateMeta;

          const tags = Array.from(
            new Set([metaContent.category, metaContent.tag].filter(Boolean))
          ) as string[];

          return {
            name: metaContent.name || dir.name,
            description: metaContent.description || `Template: ${dir.name}`,
            repositoryUrl,
            path: dir.path,
            tags,
            kind: "template",
            sourceRepo: templatesRepo,
          };
        } catch (error) {
          console.error(`Error fetching template metadata for ${dir.name}:`, error);
          return {
            name: dir.name,
            description: `Template: ${dir.name}`,
            repositoryUrl,
            path: dir.path,
            tags: [],
            kind: "template",
            sourceRepo: templatesRepo,
          };
        }
      })
    );

    return templates;
  } catch (error) {
    console.error("Error fetching templates:", error);
    return [];
  }
}

export async function fetchExamplesAndTemplates(): Promise<ExampleItem[]> {
  const [examples, templates] = await Promise.all([
    fetchExamples(),
    fetchTemplates(),
  ]);

  return [...examples, ...templates];
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
