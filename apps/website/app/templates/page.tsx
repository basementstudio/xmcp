import { Metadata } from "next";
import { SITE_URL } from "@/lib/base-url";
import { getTemplates } from "@/app/templates/utils/content";
import { TemplatesListing } from "@/components/templates/listing";
import { collectUniqueCategories } from "@/app/templates/utils/categories";
import { JsonLd } from "@/components/seo/json-ld";
import {
  getBreadcrumbSchema,
  getTemplatesItemListSchema,
} from "@/lib/structured-data";

export const dynamic = "force-static";
export const revalidate = 1800; // 30 minutes

export const metadata: Metadata = {
  title: "TypeScript MCP Server Templates | xmcp",
  description:
    "Start a TypeScript MCP server with runnable templates for authentication, Next.js and Express adapters, payments, and interactive apps.",
  alternates: {
    canonical: `${SITE_URL}/templates`,
    types: {
      "text/markdown": `${SITE_URL}/templates.md`,
    },
  },
  openGraph: {
    title: "TypeScript MCP Server Templates | xmcp",
    description:
      "Start a TypeScript MCP server with runnable templates for authentication, Next.js and Express adapters, payments, and interactive apps.",
    siteName: "xmcp",
    type: "website",
    locale: "en_US",
    url: `${SITE_URL}/templates`,
    images: {
      url: `${SITE_URL}/api/og/templates`,
      width: 1200,
      height: 630,
    },
  },
  twitter: {
    card: "summary_large_image",
    title: "TypeScript MCP Server Templates | xmcp",
    description:
      "Start a TypeScript MCP server with runnable templates for authentication, Next.js and Express adapters, payments, and interactive apps.",
    images: {
      url: `${SITE_URL}/api/og/templates`,
      width: 1200,
      height: 630,
    },
  },
};

export default async function TemplatesPage() {
  const templates = getTemplates();
  const categories = collectUniqueCategories(templates);

  return (
    <main id="main-content" className="site-page-grid">
      {templates.length > 0 && (
        <JsonLd data={getTemplatesItemListSchema(templates, SITE_URL)} />
      )}
      <JsonLd
        data={getBreadcrumbSchema(
          [
            { name: "Home", url: "/" },
            { name: "Templates", url: "/templates" },
          ],
          SITE_URL
        )}
      />
      <TemplatesListing
        templates={templates}
        categories={categories}
        currentCategory={null}
      />
    </main>
  );
}
