import { ContentCard } from "@/components/ui/content-card";
import type { BlogPost } from "@/utils/blog";

const relatedTitle = (posts: BlogPost[]) =>
  posts.every((post) => post.category === "guides")
    ? "Related guides"
    : "Related posts";

export function RelatedGuides({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null;

  return (
    <section
      aria-labelledby="related-guides-title"
      className="site-related-guides"
    >
      <h2 id="related-guides-title" className="site-related-guides-title">
        {relatedTitle(posts)}
      </h2>
      <div className="site-card-grid">
        {posts.map((post) => (
          <ContentCard key={post.slug} href={`/blog/${post.slug}`}>
            <h3 className="site-card-title">{post.title}</h3>
            <p className="site-card-description">
              {post.description ?? post.summary}
            </p>
          </ContentCard>
        ))}
      </div>
    </section>
  );
}
