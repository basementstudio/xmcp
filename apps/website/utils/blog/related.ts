import { getAllBlogPosts, type BlogPost } from "@/utils/blog";

const RELATED_POST_COUNT = 4;

const relatedGroup = (post: BlogPost) => post.topic ?? post.category;

function postsAfter(posts: BlogPost[], current: BlogPost): BlogPost[] {
  const position = posts.indexOf(current);
  return [...posts.slice(position + 1), ...posts.slice(0, position)];
}

export function getRelatedPosts(slug: string): BlogPost[] {
  const posts = getAllBlogPosts();
  const current = posts.find((post) => post.slug === slug);
  if (!current) return [];

  const candidates = postsAfter(posts, current);
  const ranked = new Set([
    ...candidates.filter(
      (post) => relatedGroup(post) === relatedGroup(current)
    ),
    ...candidates.filter((post) => post.category === current.category),
    ...candidates,
  ]);

  return [...ranked].slice(0, RELATED_POST_COUNT);
}

export function getPostsBySlugs(slugs: readonly string[]): BlogPost[] {
  const posts = getAllBlogPosts();
  return slugs.map((slug) => {
    const post = posts.find((candidate) => candidate.slug === slug);
    if (!post) throw new Error(`Unknown related guide slug: "${slug}"`);
    return post;
  });
}
