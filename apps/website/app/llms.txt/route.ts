import { source } from "../../lib/source";
import { getAllBlogPosts } from "../../utils/blog";
import { fetchTemplates } from "../templates/utils/github";
import { FAQ_ITEMS } from "../../content/faq";

export const revalidate = false;

type TreeNode = {
  type?: string;
  name?: unknown;
  url?: string;
  index?: TreeNode;
  children?: TreeNode[];
};

type DocSection = { title?: string; entries: string[] };

// Group docs links under the curated section titles and order from the
// meta.json files (via the page tree) instead of raw directory slugs.
function collectDocSections(): DocSection[] {
  const pagesByUrl = new Map(source.getPages().map((page) => [page.url, page]));
  const sections: DocSection[] = [{ entries: [] }];

  const entryFor = (url: string | undefined): string | null => {
    const page = url ? pagesByUrl.get(url) : undefined;
    if (!page) return null;
    const link = `- [${page.data.title}](${page.url})`;
    return page.data.description ? `${link}: ${page.data.description}` : link;
  };

  const visit = (node: TreeNode) => {
    if (node.type === "separator" || node.type === "folder") {
      sections.push({
        title: typeof node.name === "string" ? node.name : undefined,
        entries: [],
      });
      const indexEntry = entryFor(node.index?.url);
      if (indexEntry) sections[sections.length - 1].entries.push(indexEntry);
      node.children?.forEach(visit);
      return;
    }
    const entry = entryFor(node.url);
    if (entry) sections[sections.length - 1].entries.push(entry);
  };

  (source.pageTree.children as TreeNode[]).forEach(visit);
  return sections.filter((section) => section.entries.length > 0);
}

export async function GET() {
  const scanned: string[] = [];
  scanned.push("# xmcp");
  scanned.push(
    "> xmcp is a framework for building and shipping MCP servers with TypeScript. " +
      "Designed with DX in mind, it simplifies setup and removes friction in just one command — " +
      "making it easy to build & deploy AI tools on top of the Model Context Protocol ecosystem."
  );
  scanned.push("## Docs");

  for (const section of collectDocSections()) {
    if (section.title) {
      scanned.push(`### ${section.title}`);
    }
    scanned.push(section.entries.join("\n"));
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

  // Questions are the phrasing agents actually match on, so each one is listed
  // with its anchor instead of a single link to the page.
  scanned.push("## FAQ");
  scanned.push(
    FAQ_ITEMS.map((faq) => `- [${faq.question}](/faq#${faq.slug})`).join("\n")
  );

  scanned.push("## Pages");
  scanned.push(
    [
      "- [Showcase](/showcase): community MCP servers built with xmcp",
      "- [Telemetry](/telemetry): what anonymous telemetry xmcp collects and how to opt out",
    ].join("\n")
  );

  scanned.push("## Optional");
  scanned.push(
    [
      "- [llms-full.txt](/llms-full.txt): complete documentation and blog content in one file",
      "- [index.md](/index.md): site overview in markdown",
      "- [blog.md](/blog.md): blog index in markdown",
      "- [templates.md](/templates.md): templates index in markdown",
      "- [faq.md](/faq.md): frequently asked questions with full answers in markdown",
    ].join("\n")
  );

  return new Response(scanned.join("\n\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
