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
    <main
      id="main-content"
      className="grid grid-cols-12 gap-[20px] max-w-[1200px] w-full mx-auto px-4"
    >
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
      <div className="col-span-full grid grid-cols-12 gap-y-8 py-8 md:py-16">
        <div className="flex flex-col items-center justify-center max-w-[720px] w-full mx-auto gap-4 col-span-12 mb-8">
          <h1 className="display text-center text-balance z-10 text-gradient">
            Blog
          </h1>
          <p className="text-brand-neutral-100 text-base col-span-12 max-w-[650px] lg:col-span-5 mt-auto text-center">
            Read the latest updates, guides, and insights about xmcp.
          </p>
        </div>

        {featuredPost && <BlogHero featuredPost={featuredPost} />}

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 col-span-12">
          {regularPosts.map((post: BlogPost) => (
            <BlogCard key={post.slug} post={post} />
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
