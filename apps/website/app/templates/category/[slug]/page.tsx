import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBaseUrl } from "@/lib/base-url";
import { fetchTemplates } from "@/app/templates/utils/github";
import { collectUniqueCategories } from "@/app/templates/utils/categories";
import { slugifyCategory } from "@/app/templates/utils/slug";
import { humanizeMetadataName } from "@/app/templates/utils/detail";
import { TemplatesListing } from "@/components/templates/listing";

export const dynamic = "force-static";
export const revalidate = 1800; // 30 minutes

const baseUrl = getBaseUrl();

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const templates = await fetchTemplates();
  const categories = collectUniqueCategories(templates);
  return categories.map((category) => ({ slug: slugifyCategory(category) }));
}

async function resolveCategory(slug: string) {
  const templates = await fetchTemplates();
  const categories = collectUniqueCategories(templates);
  const match = categories.find(
    (category) => slugifyCategory(category) === slug
  );
  return { templates, categories, match };
}

export async function generateMetadata(
  props: CategoryPageProps
): Promise<Metadata> {
  const params = await props.params;
  const { match } = await resolveCategory(params.slug);

  if (!match) {
    return {
      title: "Category not found - xmcp",
      description: "The requested category could not be found.",
    };
  }

  const label = humanizeMetadataName(match);
  const title = `${label} templates - xmcp`;
  const description = `Browse ${label} templates built with xmcp — production-ready MCP servers showcasing authentication, transports, monetization, and integrations you can fork and deploy.`;
  const canonical = `${baseUrl}/templates/category/${params.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "xmcp",
      type: "website",
      locale: "en_US",
      images: {
        url: `${baseUrl}/api/og/templates`,
        width: 1200,
        height: 630,
      },
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: {
        url: `${baseUrl}/api/og/templates`,
        width: 1200,
        height: 630,
      },
    },
  };
}

export default async function CategoryPage(props: CategoryPageProps) {
  const params = await props.params;
  const { templates, categories, match } = await resolveCategory(params.slug);

  if (!match) {
    notFound();
  }

  const filtered = templates.filter((template) => {
    const label = template.primaryFilterTag ?? template.category;
    return label ? slugifyCategory(label) === params.slug : false;
  });

  return (
    <main className="grid grid-cols-12 gap-[20px] max-w-[1200px] w-full mx-auto px-4">
      <TemplatesListing
        templates={filtered}
        categories={categories}
        currentCategory={params.slug}
      />
    </main>
  );
}
