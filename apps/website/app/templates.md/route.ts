import { fetchTemplates } from "../templates/utils/github";
import { estimateTokens } from "../../lib/estimate-tokens";
import { SITE_URL } from "../../lib/base-url";

export const revalidate = false;

export async function GET() {
  const lines = [
    "# xmcp Templates",
    "> Production-ready MCP server templates built with xmcp — authentication, transports, monetization, and integrations you can fork and deploy.",
  ];

  // fetchTemplates returns [] when the GitHub API is unavailable; keep the
  // header so the route degrades instead of failing.
  const templates = await fetchTemplates();
  if (templates.length > 0) {
    const entries = templates.map((template) => {
      const parts = [
        `- [${template.name}](${SITE_URL}/templates/${template.slug})`,
      ];
      if (template.category) parts.push(`(${template.category})`);
      if (template.description) parts.push(`— ${template.description}`);
      parts.push(`— [source](${template.repositoryUrl})`);
      return parts.join(" ");
    });
    lines.push(entries.join("\n"));
  }

  const text = lines.join("\n\n");

  return new Response(text, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      // This route is the markdown half of Accept-based content negotiation,
      // so caches must key on Accept to avoid mixing it with the HTML page.
      Vary: "Accept",
      "X-Content-Type-Options": "nosniff",
      // The HTML index stays the sole indexable URL.
      Link: `<${SITE_URL}/templates>; rel="canonical"`,
      "x-markdown-tokens": String(estimateTokens(text)),
    },
  });
}
