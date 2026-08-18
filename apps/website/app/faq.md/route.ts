import { FAQ_ITEMS } from "../../content/faq";
import { estimateTokens } from "../../lib/estimate-tokens";
import { SITE_URL } from "../../lib/base-url";

export const revalidate = false;

// Markdown twin of /faq, built from the same FAQ_ITEMS the page renders, so the
// two can never drift. Each question links back to its anchor on the HTML page.
export function GET() {
  const lines = [
    "# xmcp FAQ",
    "> Answers to common questions about xmcp, the TypeScript framework for building and deploying Model Context Protocol (MCP) servers.",
  ];

  for (const faq of FAQ_ITEMS) {
    lines.push(`## ${faq.question}`);
    lines.push(faq.answer);
    lines.push(`[Permalink](${SITE_URL}/faq#${faq.slug})`);
  }

  const text = lines.join("\n\n");

  return new Response(text, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      // This route is the markdown half of Accept-based content negotiation,
      // so caches must key on Accept to avoid mixing it with the HTML page.
      Vary: "Accept",
      "X-Content-Type-Options": "nosniff",
      // The HTML page stays the sole indexable URL.
      Link: `<${SITE_URL}/faq>; rel="canonical"`,
      "x-markdown-tokens": String(estimateTokens(text)),
    },
  });
}
