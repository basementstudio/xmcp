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
        headers: {
          "User-Agent": "request",
        },
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

// formatter: 1000 => 1k, etc
function kFormatter(num: number): string {
  return Math.abs(num) > 999
    ? (Math.sign(num) * (Math.abs(num) / 1000)).toFixed(1) + "k"
    : (Math.sign(num) * Math.abs(num)).toString();
}

export type ExampleItem = {
  name: string;
  description: string;
  repositoryUrl: string;
  path: string;
  tags?: string[];
};

export async function fetchExamples(): Promise<ExampleItem[]> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/basementstudio/xmcp/contents/examples`,
      {
        headers: {
          "User-Agent": "request",
        },
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
              headers: {
                "User-Agent": "request",
              },
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
          };
        } catch (error) {
          console.error(`Error fetching package.json for ${dir.name}:`, error);
          return {
            name: dir.name,
            description: `Example: ${dir.name}`,
            repositoryUrl: `https://github.com/basementstudio/xmcp/tree/main/examples/${dir.name}`,
            path: dir.path,
            tags: [],
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
