import { source } from "../../lib/source";
import { getAllBlogPosts } from "../../utils/blog";
import { fetchTemplates } from "../templates/utils/github";

export const revalidate = false;

export async function GET() {
  const scanned: string[] = [];
  scanned.push("# xmcp");
  scanned.push(
    "> xmcp is a framework for building and shipping MCP servers with TypeScript. " +
      "Designed with DX in mind, it simplifies setup and removes friction in just one command — " +
      "making it easy to build & deploy AI tools on top of the Model Context Protocol ecosystem."
  );
  scanned.push("## Docs");
  const map = new Map<string, string[]>();

  for (const page of source.getPages()) {
    const dir = page.slugs[0];
    const list = map.get(dir) ?? [];
    list.push(`- [${page.data.title}](${page.url}): ${page.data.description}`);
    map.set(dir, list);
  }

  for (const [key, value] of map) {
    if (key) {
      scanned.push(`## ${key}`);
    }
    scanned.push(value.join("\n"));
  }

  // Deliberately includes unlisted "ghost" posts: they are hidden from
  // on-site listings but published for search and answer engines, and this
  // index is their machine-facing discovery channel.
  scanned.push("## Blog");
  scanned.push(
    getAllBlogPosts()
      .map((post) => {
        const description = post.description ?? post.summary;
        const link = `- [${post.title}](/blog/${post.slug})`;
        return description ? `${link}: ${description}` : link;
      })
      .join("\n")
  );

  // fetchTemplates returns [] when the GitHub API is unavailable; the docs
  // and blog sections above never depend on that fetch.
  const templates = await fetchTemplates();
  if (templates.length > 0) {
    scanned.push("## Templates");
    scanned.push(
      templates
        .map(
          (template) =>
            `- [${template.name}](/templates/${template.slug}): ${template.description}`
        )
        .join("\n")
    );
  }

  scanned.push("## Optional");
  scanned.push(
    [
      "- [llms-full.txt](/llms-full.txt): complete documentation content in one file",
      "- [index.md](/index.md): site overview in markdown",
    ].join("\n")
  );

  return new Response(scanned.join("\n\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
