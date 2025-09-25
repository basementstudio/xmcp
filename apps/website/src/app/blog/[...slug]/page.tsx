import {
  getBlogPostBySlug,
  getAllBlogPosts,
  type BlogPost,
} from "@/utils/blog";
import { notFound } from "next/navigation";
import { CustomMDX } from "@/components/markdown/renderer";
import Link from "next/link";
import { Icons } from "@/components/ui/icons";

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
      <div className="flex-1 pt-16">
        <div className="mb-8">
          <Link
            href="/blog"
            className="text-white font-medium hover:underline mb-4 inline-flex items-center gap-2"
          >
            <Icons.arrowLeft className="w-4 h-4" />
            BACK TO BLOG
          </Link>

          <h1 className="text-4xl uppercase text-white mb-6 mt-8 ">
            {post.title}
          </h1>

          <hr className="border-white/20 mb-6" />

          <div className="flex items-center justify-between mb-8">
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
        </div>

        <article className="prose w-full max-w-full mb-40 overflow-hidden">
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
