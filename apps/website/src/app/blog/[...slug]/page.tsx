import {
  getBlogPostBySlug,
  getAllBlogPosts,
  type BlogPost,
} from "@/utils/blog";
import { notFound } from "next/navigation";
import { CustomMDX } from "@/components/markdown/renderer";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const slug = (await params).slug;
  const postSlug = slug ? slug.join("/") : "";

  if (!postSlug) {
    return {
      title: "Blog - xmcp",
      description: "Latest updates, guides, and insights about xmcp",
    };
  }

  const post = getBlogPostBySlug(postSlug);

  if (!post) {
    return {
      title: "Post Not Found - xmcp",
    };
  }

  const canonicalUrl = `https://xmcp.dev/blog/${postSlug}`;

  return {
    title: `${post.title} - xmcp Blog`,
    description: post.description || `${post.title} - xmcp Blog`,
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const slug = (await params).slug;
  const postSlug = slug ? slug.join("/") : "";

  if (!postSlug) {
    notFound();
  }

  const post = getBlogPostBySlug(postSlug);

  if (!post) {
    notFound();
  }

  return (
    <div className="flex gap-8 w-full flex-col">
      <div className="flex-1 pt-16 px-4 lg:px-0 box-content max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/blog"
            className="text-white font-medium hover:underline mb-4 inline-block"
          >
            BACK TO BLOG
          </Link>

          <div className="flex items-center justify-between mb-6">
            <span className="text-xs px-2 py-1 border border-white/20 text-white/80 uppercase tracking-wide">
              {post.category}
            </span>
            {post.date && (
              <time
                dateTime={post.date}
                className="text-xs text-[#BABABA] uppercase tracking-wide"
              >
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </time>
            )}
          </div>

          <hr className="border-white/20 mt-6 mb-8" />
        </div>

        <article className="prose max-w-none mb-40">
          <CustomMDX source={post.content} />
        </article>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  const posts = getAllBlogPosts();

  return posts.map((post: BlogPost) => ({
    slug: post.slug.split("/"),
  }));
}
