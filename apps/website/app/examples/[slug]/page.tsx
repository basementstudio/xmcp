import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  fetchExampleBySlug,
  fetchExampleReadme,
  fetchExamplesAndTemplates,
} from "@/app/examples/utils/github";
import { EXAMPLES_REVALIDATE_SECONDS } from "@/app/examples/utils/constants";
import {
  formatRepositoryLabel,
  humanizeMetadataName,
  isTypeLabel,
  normalizeDisplayLabel,
  rankRelatedItems,
  stripLeadingHeading,
} from "@/app/examples/utils/detail";
import { buildDeployOptions } from "@/app/examples/utils/deploy";
import { ExampleBreadcrumb } from "@/components/examples/detail/breadcrumb";
import { ExampleDetailHeader } from "@/components/examples/detail/header";
import { RelatedExamples } from "@/components/examples/detail/related-items";
import { ExampleReadmeContent } from "@/components/examples/detail/readme-content";
import { ExampleDetailSidebar } from "@/components/examples/detail/sidebar";
import { getBaseUrl } from "@/lib/base-url";
import { resolveExamplePreviewImage } from "@/lib/example-preview-image";

export const revalidate = EXAMPLES_REVALIDATE_SECONDS;

const baseUrl = getBaseUrl();

type ExampleDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const items = await fetchExamplesAndTemplates();
  const seen = new Map<string, string>();

  for (const item of items) {
    const existing = seen.get(item.slug);
    if (existing) {
      console.warn(
        `[examples] slug collision: "${item.slug}" exists as both ${existing} and ${item.type}`
      );
    } else {
      seen.set(item.slug, item.type);
    }
  }

  return [
    ...new Map(items.map((item) => [item.slug, { slug: item.slug }])).values(),
  ];
}

export async function generateMetadata(
  props: ExampleDetailPageProps
): Promise<Metadata> {
  const params = await props.params;
  const example = await fetchExampleBySlug(params.slug);

  if (!example) {
    return {
      title: "Example not found - xmcp",
      description: "The requested example could not be found.",
    };
  }

  const canonical = `${baseUrl}/examples/${example.slug}`;
  const metadataName = humanizeMetadataName(example.name);
  const metadataTitle = `${metadataName} | xmcp Examples`;
  const metadataKeywords = Array.from(
    new Set(
      [
        ...(example.metadataKeywords ?? []),
        ...(example.tags ?? []),
        example.category,
      ].filter(Boolean)
    )
  ) as string[];

  return {
    title: metadataTitle,
    description: example.description,
    keywords: metadataKeywords,
    alternates: { canonical },
    openGraph: {
      title: metadataTitle,
      description: example.description,
      url: canonical,
      siteName: "xmcp",
      type: "website",
      images: example.previewUrl
        ? [
            {
              url: example.previewUrl,
              width: 1200,
              height: 630,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: metadataTitle,
      description: example.description,
      images: example.previewUrl ? [example.previewUrl] : undefined,
    },
  };
}

export default async function ExampleDetailPage(props: ExampleDetailPageProps) {
  const params = await props.params;
  const items = await fetchExamplesAndTemplates();
  const example = items.find((item) => item.slug === params.slug) ?? null;

  if (!example) {
    notFound();
  }

  const readmeContent = await fetchExampleReadme(example);
  const moreExamples = rankRelatedItems(example, items);
  const deployOptions = buildDeployOptions(example);
  const pageUrl = `${baseUrl}/examples/${example.slug}`;
  const shareMessage = `Check out ${example.name} on xmcp`;
  const xShareUrl = `https://www.x.com/intent/post?text=${encodeURIComponent(
    shareMessage
  )}&url=${encodeURIComponent(pageUrl)}`;
  const categoryItems = Array.from(
    new Set([
      ...(example.category && !isTypeLabel(example.category)
        ? [example.category]
        : []),
      ...(example.tags ?? []).filter((tag) => !isTypeLabel(tag)),
    ])
  );
  const previewImage = resolveExamplePreviewImage(example);
  const displayName = normalizeDisplayLabel(example.name);
  const repositoryLabel = formatRepositoryLabel(example.repositoryUrl);
  const fallbackReadme = `# README not found

Add a README.md to this template to show content here.`;
  const bodyContent = stripLeadingHeading(readmeContent ?? fallbackReadme);

  return (
    <main className="max-w-[1200px] w-full mx-auto px-4 py-12 md:py-16 space-y-10">
      <ExampleBreadcrumb name={displayName} />

      <div className="space-y-4 md:space-y-6">
        <ExampleDetailHeader
          name={displayName}
          description={example.description}
          demoUrl={example.demoUrl}
          deployOptions={deployOptions}
        />

        <div className="relative w-full overflow-hidden rounded-xs border border-brand-neutral-500">
          <div className="aspect-[16/8] relative">
            {!previewImage.isFallback ? (
              <Image
                src={previewImage.src}
                alt={`${example.name} preview`}
                fill
                sizes="100vw"
                className="object-cover"
                priority
              />
            ) : (
              <Image
                src={previewImage.src}
                alt={`${example.name} preview`}
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
        <ExampleDetailSidebar
          example={example}
          repositoryLabel={repositoryLabel}
          categoryItems={categoryItems}
          pageUrl={pageUrl}
          xShareUrl={xShareUrl}
        />

        <section className="lg:col-span-9 space-y-6 pl-8 border-l border-brand-neutral-500">
          <ExampleReadmeContent source={bodyContent} />
        </section>
      </div>

      <RelatedExamples items={moreExamples} />
    </main>
  );
}
