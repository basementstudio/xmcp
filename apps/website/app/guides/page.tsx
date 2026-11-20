import type { Metadata } from "next";
import Link from "next/link";
import { getGuidePosts } from "@/utils/blog";
import { GuidesListing, type GuideSummary } from "@/components/guides/listing";
import { GUIDE_TOPICS } from "@/lib/guide-topics";
import { SITE_URL } from "@/lib/base-url";
import { JsonLd } from "@/components/seo/json-ld";
import { getBreadcrumbSchema } from "@/lib/structured-data";

const title =
  "MCP Guides: Build, Authenticate, and Deploy TypeScript Servers | xmcp";
const description =
  "Learn MCP concepts, compare server frameworks, and build, secure, debug, and deploy TypeScript MCP servers with practical xmcp guides.";
export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: `${SITE_URL}/guides`,
    types: { "text/markdown": `${SITE_URL}/guides.md` },
  },
  openGraph: { title, description, url: `${SITE_URL}/guides`, type: "website" },
  twitter: { title, description, card: "summary_large_image" },
};

export default function GuidesPage() {
  const posts = getGuidePosts();
  const guides: GuideSummary[] = posts.map((post) => ({
    slug: post.slug,
    title: post.title,
    description: post.description ?? post.summary,
    topic: post.topic,
    date: post.date,
    dateLabel: post.date && formatGuideDate(post.date),
  }));
  const topics = GUIDE_TOPICS.filter((topic) =>
    posts.some((post) => post.topic === topic)
  );
  return (
    <main id="main-content" className="site-page-grid">
      <JsonLd
        data={[
          getBreadcrumbSchema(
            [
              { name: "Home", url: "/" },
              { name: "Guides", url: "/guides" },
            ],
            SITE_URL
          ),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: title,
            description,
            url: `${SITE_URL}/guides`,
            mainEntity: {
              "@type": "ItemList",
              itemListElement: posts.map((post, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: post.title,
                url: `${SITE_URL}/blog/${post.slug}`,
              })),
            },
          },
        ]}
      />
      <div className="site-listing">
        <div className="listing-intro">
          <p className="eyebrow">The field guides / Learn MCP</p>
          <h1 className="display">MCP guides</h1>
          <p className="listing-description">{description}</p>
          <p className="listing-description">
            Ready to build? Start with{" "}
            <Link
              className="underline"
              href="/docs/getting-started/installation"
            >
              installation
            </Link>
            , choose a{" "}
            <Link className="underline" href="/templates">
              template
            </Link>
            , or explore{" "}
            <Link className="underline" href="/integrations">
              integrations
            </Link>
            .
          </p>
        </div>
        <GuidesListing guides={guides} topics={topics} />
      </div>
    </main>
  );
}

function formatGuideDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
