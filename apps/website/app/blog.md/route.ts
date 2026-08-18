import { getListedBlogPosts } from "../../utils/blog";
import { estimateTokens } from "../../lib/estimate-tokens";
import { SITE_URL } from "../../lib/base-url";

export const revalidate = false;

// Markdown twin of the /blog index. Mirrors the on-site listing, so unlisted
// "ghost" posts are excluded here — they are indexed via /llms.txt instead.
export function GET() {
  const lines = [
    "# xmcp Blog",
    "> Guides, release notes, and engineering articles about building TypeScript MCP servers and production-ready agent tools.",
  ];

  const entries = getListedBlogPosts().map((post) => {
    const parts = [`- [${post.title}](${SITE_URL}/blog/${post.slug}.md)`];
    if (post.date) parts.push(post.date);
    const description = post.description ?? post.summary;
    if (description) parts.push(description);
    return parts.join(" — ");
  });
  lines.push(entries.join("\n"));

  const text = lines.join("\n\n");

  return new Response(text, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      // This route is the markdown half of Accept-based content negotiation,
      // so caches must key on Accept to avoid mixing it with the HTML page.
      Vary: "Accept",
      "X-Content-Type-Options": "nosniff",
      // The HTML index stays the sole indexable URL.
      Link: `<${SITE_URL}/blog>; rel="canonical"`,
      "x-markdown-tokens": String(estimateTokens(text)),
    },
  });
}
