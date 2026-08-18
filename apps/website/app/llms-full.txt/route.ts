import { source, blogSource } from "../../lib/source";
import { getLLMText, getBlogLLMText } from "../../lib/get-llm-text";
import { estimateTokens } from "../../lib/estimate-tokens";

// cached forever
export const revalidate = false;

// "Complete content in one file", as advertised by /llms.txt and /index.md:
// every docs page followed by every blog post (including unlisted ghosts,
// which are published for answer engines).
export async function GET() {
  const docs = await Promise.all(source.getPages().map(getLLMText));
  const posts = await Promise.all(blogSource.getPages().map(getBlogLLMText));
  const text = [...docs, ...posts].join("\n\n");

  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "x-markdown-tokens": String(estimateTokens(text)),
    },
  });
}
