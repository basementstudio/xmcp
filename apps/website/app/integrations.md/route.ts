import { getIntegrationPages } from "@/lib/source";
import { SITE_URL } from "@/lib/base-url";
import { estimateTokens } from "@/lib/estimate-tokens";

export const revalidate = false;
export function GET() {
  const text = [
    "# MCP server integrations",
    "Connect xmcp tools to authentication, payments, databases, design tools, and APIs with setup guides and runnable examples.",
    ...getIntegrationPages().map(
      (page) =>
        `- [${page.data.title}](${SITE_URL}${page.url}): ${page.data.description ?? ""}`
    ),
  ].join("\n\n");
  return new Response(text, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
      "X-Content-Type-Options": "nosniff",
      Link: `<${SITE_URL}/integrations>; rel="canonical"`,
      "x-markdown-tokens": String(estimateTokens(text)),
    },
  });
}
