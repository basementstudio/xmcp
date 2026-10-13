import {
  getListedBlogPosts,
  getFeaturedBlogPost,
  type BlogPost,
} from "../../utils/blog";
import { BlogHero } from "../../components/blog/hero";
import { BlogCard } from "@/components/home/blog";
import { JsonLd } from "@/components/seo/json-ld";
import {
  getBlogCollectionSchema,
  getBreadcrumbSchema,
} from "@/lib/structured-data";
import { SITE_URL } from "@/lib/base-url";

export const dynamic = "force-static";

export const metadata = {
  title: "xmcp Blog - MCP Guides, Releases, and Engineering Notes",
  description:
    "Read xmcp guides, release notes, and engineering articles about building TypeScript MCP servers and production-ready agent tools.",
  alternates: {
    canonical: "https://xmcp.dev/blog",
    types: {
      "text/markdown": "https://xmcp.dev/blog.md",
    },
  },
  openGraph: {
    title: "xmcp Blog - MCP Guides, Releases, and Engineering Notes",
    description:
      "Read xmcp guides, release notes, and engineering articles about building TypeScript MCP servers and production-ready agent tools.",
    url: "https://xmcp.dev/blog",
    siteName: "xmcp",
    type: "website",
    locale: "en_US",
    images: {
      url: "/xmcp-og.png",
      width: 1200,
      height: 630,
    },
  },
  twitter: {
    card: "summary_large_image",
    title: "xmcp Blog - MCP Guides, Releases, and Engineering Notes",
    description:
      "Read xmcp guides, release notes, and engineering articles about building TypeScript MCP servers and production-ready agent tools.",
    images: "/xmcp-og.png",
  },
};

export default function BlogPage() {
  const posts = getListedBlogPosts();
  const featuredPost = getFeaturedBlogPost();

  const regularPosts = featuredPost
    ? posts.filter((post: BlogPost) => post.slug !== featuredPost.slug)
    : posts;

  return (
    <main id="main-content" className="site-page-grid">
      <JsonLd
        data={[
          getBlogCollectionSchema(posts, SITE_URL),
          getBreadcrumbSchema(
            [
              { name: "Home", url: "/" },
              { name: "Blog", url: "/blog" },
            ],
            SITE_URL
          ),
        ]}
      />
      <div className="site-listing">
        <div className="listing-intro">
          <p className="eyebrow">The field notes / Blog</p>
          <h1 className="display">Blog</h1>
          <p className="listing-description">
            Read the latest updates, guides, and insights about xmcp.
          </p>
        </div>

        {featuredPost && <BlogHero featuredPost={featuredPost} />}

        <div className="site-card-grid">
          {regularPosts.map((post: BlogPost, index: number) => (
            <BlogCard
              key={post.slug}
              post={post}
              // The first row is visible below the featured post.
              loading={index < 2 ? "eager" : "lazy"}
            />
          ))}

          {regularPosts.length === 0 && !featuredPost && (
            <p className="text-brand-neutral-200 text-center py-12 text-sm">
              No blog posts yet. Check back soon!
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
