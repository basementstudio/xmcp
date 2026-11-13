import type { Metadata } from "next";
import Link from "next/link";
import { getGuidePosts } from "@/utils/blog";
import { ContentCard } from "@/components/ui/content-card";
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
            <Link className="underline" href="/docs/integrations">
              integrations
            </Link>
            .
          </p>
        </div>
        <div className="site-card-grid">
          {posts.map((post) => (
            <ContentCard key={post.slug} href={`/blog/${post.slug}`}>
              <h2 className="site-card-title">{post.title}</h2>
              <p className="text-sm text-brand-neutral-100">
                {post.description ?? post.summary}
              </p>
            </ContentCard>
          ))}
        </div>
      </div>
    </main>
  );
}
