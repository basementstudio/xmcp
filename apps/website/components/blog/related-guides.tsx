import { ContentCard } from "@/components/ui/content-card";
import type { BlogPost } from "@/utils/blog";

interface RelatedGuidesProps {
  posts: BlogPost[];
  title: string;
}

export function RelatedGuides({ posts, title }: RelatedGuidesProps) {
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="related-guides-title" className="space-y-4">
      <h2 id="related-guides-title" className="site-section-title">
        {title}
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
