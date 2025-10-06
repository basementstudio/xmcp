import {
  getAllBlogPosts,
  getFeaturedBlogPost,
  type BlogPost,
} from "../../utils/blog";
import Link from "next/link";
import Image from "next/image";
import { BlogHero } from "../../components/blog/hero";

export const metadata = {
  title: "Blog - xmcp",
  description: "Latest updates, guides, and insights about xmcp",
  alternates: {
    canonical: "https://xmcp.dev/blog",
  },
};

export default function BlogPage() {
  const posts = getAllBlogPosts();
  const featuredPost = getFeaturedBlogPost();

  const regularPosts = featuredPost
    ? posts.filter((post: BlogPost) => post.slug !== featuredPost.slug)
    : posts;

  return (
    <div className="flex gap-8 w-full flex-col">
      <div className="flex-1 pt-10 px-4 lg:px-0 box-content max-w-6xl mx-auto">
        <div className="prose mb-12">
          <h1 className="text-white uppercase font-medium">Blog</h1>
          <p className="text-[#BABABA]">
            Read the latest updates, guides, and insights about xmcp.
          </p>
        </div>

        {featuredPost && <BlogHero featuredPost={featuredPost} />}

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {regularPosts.map((post: BlogPost) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="text-left group relative overflow-visible h-full min-w-[280px] block"
            >
              <div className="top-1 left-1 absolute w-full h-full group-hover:border group-hover:visible invisible border-[#333]" />
              <div className="relative border p-4 group-hover:bg-black h-full min-h-[16rem] w-full flex flex-col border-[#333]">
                <div className="w-full aspect-video border border-white/20 bg-black/20 mb-4 overflow-hidden relative">
                  {post.previewImage ? (
                    <Image
                      src={post.previewImage}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                      <span className="text-gray-500 text-sm uppercase tracking-wide">
                        {post.category}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs px-2 py-1 border border-white/20 text-white/80 uppercase tracking-wide">
                    {post.category}
                  </span>
                  {post.date && (
                    <time
                      dateTime={post.date}
                      className="text-xs text-[#BABABA] uppercase tracking-wide"
                    >
                      {new Date(post.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </time>
                  )}
                </div>

                <h3 className="text-base text-white font-medium mb-3 leading-tight uppercase mt-3">
                  {post.title}
                </h3>

                <div className="flex-1 flex flex-col justify-between">
                  {post.description && (
                    <p className="text-sm text-[#BABABA] leading-relaxed">
                      {post.description}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}

          {regularPosts.length === 0 && !featuredPost && (
            <p className="text-[#BABABA] text-center py-12 text-sm">
              No blog posts yet. Check back soon!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
