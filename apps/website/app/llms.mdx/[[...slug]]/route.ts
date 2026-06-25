import { getLLMText } from "../../../lib/get-llm-text";
import { estimateTokens } from "../../../lib/estimate-tokens";
import { source } from "../../../lib/source";
import { notFound } from "next/navigation";

export const revalidate = false;

export async function GET(
  _req: Request,
  { params }: RouteContext<"/llms.mdx/[[...slug]]">
) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  const text = await getLLMText(page);

  return new Response(text, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      // This route is the markdown half of Accept-based content negotiation,
      // so caches must key on Accept to avoid mixing it with the HTML page.
      Vary: "Accept",
      "x-markdown-tokens": String(estimateTokens(text)),
    },
  });
}

export function generateStaticParams() {
  return source.generateParams();
}
