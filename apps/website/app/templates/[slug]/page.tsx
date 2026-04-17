import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  fetchTemplateBySlug,
  fetchTemplateReadme,
  fetchTemplates,
} from "@/app/templates/utils/github";
import {
  formatRepositoryLabel,
  humanizeMetadataName,
  isTypeLabel,
  normalizeDisplayLabel,
  rankRelatedItems,
  stripLeadingHeading,
} from "@/app/templates/utils/detail";
import { buildDeployOptions } from "@/app/templates/utils/deploy";
import { TemplateBreadcrumb } from "@/components/templates/detail/breadcrumb";
import { TemplateDetailHeader } from "@/components/templates/detail/header";
import { RelatedTemplates } from "@/components/templates/detail/related-items";
import { TemplateReadmeContent } from "@/components/templates/detail/readme-content";
import { TemplateDetailSidebar } from "@/components/templates/detail/sidebar";
import { getBaseUrl } from "@/lib/base-url";
import { resolveTemplatePreviewImage } from "@/lib/template-preview-image";

export const revalidate = 1800; // 30 minutes

const baseUrl = getBaseUrl();

type TemplateDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const items = await fetchTemplates();
  return items.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata(
  props: TemplateDetailPageProps
): Promise<Metadata> {
  const params = await props.params;
  const template = await fetchTemplateBySlug(params.slug);

  if (!template) {
    return {
      title: "Template not found - xmcp",
      description: "The requested template could not be found.",
    };
  }

  const canonical = `${baseUrl}/templates/${template.slug}`;
  const metadataName = humanizeMetadataName(template.name);
  const metadataTitle = `${metadataName} | xmcp Templates`;
  const metadataKeywords = Array.from(
    new Set(
      [
        ...(template.metadataKeywords ?? []),
        ...(template.tags ?? []),
        template.category,
      ].filter(Boolean)
    )
  ) as string[];

  return {
    title: metadataTitle,
    description: template.description,
    keywords: metadataKeywords,
    alternates: { canonical },
    openGraph: {
      title: metadataTitle,
      description: template.description,
      url: canonical,
      siteName: "xmcp",
      type: "website",
      images: template.previewUrl
        ? [
            {
              url: template.previewUrl,
              width: 1200,
              height: 630,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: metadataTitle,
      description: template.description,
      images: template.previewUrl ? [template.previewUrl] : undefined,
    },
  };
}

export default async function TemplateDetailPage(
  props: TemplateDetailPageProps
) {
  const params = await props.params;
  const items = await fetchTemplates();
  const template = items.find((item) => item.slug === params.slug) ?? null;

  if (!template) {
    notFound();
  }

  const readmeContent = await fetchTemplateReadme(template);
  const moreTemplates = rankRelatedItems(template, items);
  const deployOptions = buildDeployOptions(template);
  const pageUrl = `${baseUrl}/templates/${template.slug}`;
  const shareMessage = `Check out ${template.name} on xmcp`;
  const xShareUrl = `https://www.x.com/intent/post?text=${encodeURIComponent(
    shareMessage
  )}&url=${encodeURIComponent(pageUrl)}`;
  const categoryItems = Array.from(
    new Set([
      ...(template.category && !isTypeLabel(template.category)
        ? [template.category]
        : []),
      ...(template.tags ?? []).filter((tag) => !isTypeLabel(tag)),
    ])
  );
  const previewImage = resolveTemplatePreviewImage(template);
  const displayName = normalizeDisplayLabel(template.name);
  const repositoryLabel = formatRepositoryLabel(template.repositoryUrl);
  const fallbackReadme = `# README not found

Add a README.md to this template to show content here.`;
  const bodyContent = stripLeadingHeading(readmeContent ?? fallbackReadme);

  return (
    <main className="max-w-[1200px] w-full mx-auto px-4 py-12 md:py-16 space-y-10">
      <TemplateBreadcrumb name={displayName} />

      <div className="space-y-4 md:space-y-6">
        <TemplateDetailHeader
          name={displayName}
          description={template.description}
          demoUrl={template.demoUrl}
          replitUrl={template.replitUrl}
          deployOptions={deployOptions}
        />

        <div className="relative w-full overflow-hidden rounded-xs border border-brand-neutral-500">
          <div className="aspect-[16/8] relative">
            {!previewImage.isFallback ? (
              <Image
                src={previewImage.src}
                alt={`${template.name} preview`}
                fill
                sizes="100vw"
                className="object-cover"
                priority
              />
            ) : (
              <Image
                src={previewImage.src}
                alt={`${template.name} preview`}
                fill
                sizes="100vw"
                unoptimized
                className={
                  previewImage.isNextJsFallback
                    ? "object-contain [object-position:center_70%] scale-90"
                    : "object-contain [object-position:center_70%]"
                }
                priority
              />
            )}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-90">
              <Image
                src="/textures/text5.png"
                alt=""
                aria-hidden
                fill
                sizes="100vw"
                className="absolute inset-0 h-full w-full object-cover [transform:scaleX(-1)] mix-blend-plus-lighter opacity-100"
                priority={false}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <TemplateDetailSidebar
          template={template}
          repositoryLabel={repositoryLabel}
          categoryItems={categoryItems}
          pageUrl={pageUrl}
          xShareUrl={xShareUrl}
        />

        <section className="lg:col-span-9 space-y-6 pl-8 border-l border-brand-neutral-500">
          <TemplateReadmeContent source={bodyContent} />
        </section>
      </div>

      <RelatedTemplates items={moreTemplates} />
    </main>
  );
}
