import { notFound } from "next/navigation";
import {
  getTemplateBySlug,
  getTemplateReadme,
  getTemplates,
} from "@/app/templates/utils/content";
import {
  normalizeDisplayLabel,
  stripLeadingHeading,
} from "@/app/templates/utils/detail";
import { estimateTokens } from "@/lib/estimate-tokens";
import { SITE_URL } from "@/lib/base-url";

// Like the docs and blog twins, local template content updates on redeploy.
export const revalidate = false;

export async function GET(
  _req: Request,
  { params }: RouteContext<"/llms-templates.mdx/[slug]">
) {
  const { slug } = await params;
  const template = getTemplateBySlug(slug);
  if (!template) notFound();

  const readme = getTemplateReadme(template);
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
  const items = getTemplates();
  return items.map((item) => ({ slug: item.slug }));
}
