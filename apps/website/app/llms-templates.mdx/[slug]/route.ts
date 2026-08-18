import { notFound } from "next/navigation";
import {
  fetchTemplateBySlug,
  fetchTemplateReadme,
  fetchTemplates,
} from "@/app/templates/utils/github";
import {
  normalizeDisplayLabel,
  stripLeadingHeading,
} from "@/app/templates/utils/detail";
import { estimateTokens } from "@/lib/estimate-tokens";
import { SITE_URL } from "@/lib/base-url";

// Cached forever like the docs and blog twins; the underlying GitHub fetches
// still revalidate on their own window, and new templates appear on redeploy.
export const revalidate = false;

export async function GET(
  _req: Request,
  { params }: RouteContext<"/llms-templates.mdx/[slug]">
) {
  const { slug } = await params;
  const template = await fetchTemplateBySlug(slug);
  if (!template) notFound();

  const readme = await fetchTemplateReadme(template);
  const text = [
    `# ${normalizeDisplayLabel(template.name)}`,
    `> ${template.description}`,
    `[Source repository](${template.repositoryUrl})`,
    readme ? stripLeadingHeading(readme) : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  return new Response(text, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      // This route is the markdown half of Accept-based content negotiation,
      // so caches must key on Accept to avoid mixing it with the HTML page.
      Vary: "Accept",
      "X-Content-Type-Options": "nosniff",
      // The HTML page stays the sole indexable URL for this content.
      Link: `<${SITE_URL}/templates/${template.slug}>; rel="canonical"`,
      "x-markdown-tokens": String(estimateTokens(text)),
    },
  });
}

export async function generateStaticParams() {
  const items = await fetchTemplates();
  return items.map((item) => ({ slug: item.slug }));
}
