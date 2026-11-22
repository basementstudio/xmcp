import { getAllBlogPosts, type BlogPost } from "@/utils/blog";

const RELATED_POST_COUNT = 3;

const relatedGroup = (post: BlogPost) => post.topic ?? post.category;

export function getRelatedPosts(slug: string): BlogPost[] {
  const posts = getAllBlogPosts();
  const current = posts.find((post) => post.slug === slug);
  if (!current) return [];

  const group = posts.filter(
    (post) => relatedGroup(post) === relatedGroup(current)
  );
  const position = group.indexOf(current);
  const count = Math.min(RELATED_POST_COUNT, group.length - 1);

  return Array.from(
    { length: count },
    (_, offset) => group[(position + offset + 1) % group.length]
  );
}

export function getPostsBySlugs(slugs: readonly string[]): BlogPost[] {
  const posts = getAllBlogPosts();
  return slugs.map((slug) => {
    const post = posts.find((candidate) => candidate.slug === slug);
    if (!post) throw new Error(`Unknown related guide slug: "${slug}"`);
    return post;
  });
}
