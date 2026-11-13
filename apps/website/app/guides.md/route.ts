import { getGuidePosts } from "@/utils/blog";
import { SITE_URL } from "@/lib/base-url";
import { estimateTokens } from "@/lib/estimate-tokens";

export const revalidate = false;
export function GET() {
  const text = [
    "# MCP guides",
    "Build, authenticate, debug, and deploy TypeScript MCP servers.",
    ...getGuidePosts().map(
      (post) =>
        `- [${post.title}](${SITE_URL}/blog/${post.slug}): ${post.description ?? post.summary ?? ""}`
    ),
  ].join("\n\n");
  return new Response(text, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
      "X-Content-Type-Options": "nosniff",
      Link: `<${SITE_URL}/guides>; rel="canonical"`,
      "x-markdown-tokens": String(estimateTokens(text)),
    },
  });
}
