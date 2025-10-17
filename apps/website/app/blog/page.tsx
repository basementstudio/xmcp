import {
  getAllBlogPosts,
  getFeaturedBlogPost,
  type BlogPost,
} from "../../utils/blog";
import { BlogHero } from "../../components/blog/hero";
import { BlogCard } from "@/components/home/blog";

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
    <div className="grid grid-cols-12 gap-[20px] max-w-[1200px] w-full mx-auto px-4">
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
    </div>
  );
}
