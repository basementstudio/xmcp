import { Metadata } from "next";
import { getBaseUrl } from "@/lib/base-url";
import { fetchTemplates } from "@/app/templates/utils/github";
import { TemplatesListing } from "@/components/templates/listing";
import { collectUniqueCategories } from "@/app/templates/utils/categories";

export const dynamic = "force-static";
export const revalidate = 1800; // 30 minutes

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  title: "Templates - xmcp",
  description:
    "Explore templates to get started with xmcp. Learn from real-world implementations and best practices.",
  alternates: {
    canonical: `${baseUrl}/templates`,
  },
  openGraph: {
    title: "Templates - xmcp",
    description:
      "Explore templates to get started with xmcp. Learn from real-world implementations and best practices.",
    siteName: "xmcp",
    type: "website",
    locale: "en_US",
    url: `${baseUrl}/templates`,
    images: {
      url: `${baseUrl}/api/og/templates`,
      width: 1200,
      height: 630,
    },
  },
  twitter: {
    card: "summary_large_image",
    title: "Templates - xmcp",
    description:
      "Explore templates to get started with xmcp. Learn from real-world implementations and best practices.",
    images: {
      url: `${baseUrl}/api/og/templates`,
      width: 1200,
      height: 630,
    },
  },
};

export default async function TemplatesPage() {
  const templates = await fetchTemplates();
  const categories = collectUniqueCategories(templates);

  return (
    <main className="grid grid-cols-12 gap-[20px] max-w-[1200px] w-full mx-auto px-4">
      <TemplatesListing
        templates={templates}
        categories={categories}
        currentCategory={null}
      />
    </main>
  );
}
