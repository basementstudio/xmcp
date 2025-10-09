import fs from "fs";
import matter from "gray-matter";

export type BlogCategory = "changelog" | "guides";

export interface BlogFrontmatter {
  title?: string;
  description?: string;
  date?: string;
  category?: BlogCategory;
  order?: number;
  featured?: boolean;
  previewImage?: string;
  [key: string]: unknown;
}

export interface BlogPost {
  slug: string;
  title: string;
  content: string;
  data: BlogFrontmatter;
  path: string;
  order: number;
  category: BlogCategory;
  date?: string;
  description?: string;
  featured?: boolean;
  previewImage?: string;
}

export function getAllBlogPosts(): BlogPost[] {
  const posts: BlogPost[] = [];

  if (!fs.existsSync(BLOG_DIRECTORY)) {
    return posts;
  }

  const items = fs.readdirSync(BLOG_DIRECTORY);

  for (const item of items) {
    const itemPath = path.join(BLOG_DIRECTORY, item);
    const stat = fs.statSync(itemPath);

    if (stat.isFile() && item.endsWith(".mdx")) {
      const fileContent = fs.readFileSync(itemPath, "utf8");
      const { data, content } = matter(fileContent);

      const { order } = extractOrderFromFilename(item);
      const slug = generateSlugFromPath("", item);
      const title = data.title || generateTitleFromFilename(item);

      let category: BlogCategory = "guides";
      if (data.category && ["changelog", "guides"].includes(data.category)) {
        category = data.category as BlogCategory;
      }

      posts.push({
        slug,
        title,
        content,
        data,
        path: itemPath,
        order: data.order || order,
        category,
        date: data.date,
        description: data.description,
        featured: data.featured || false,
        previewImage: data.previewImage,
      });
    }
  }

  posts.sort((a, b) => {
    if (a.date && b.date) {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (a.date && !b.date) return -1;
    if (!a.date && b.date) return 1;
    return a.order - b.order;
  });

  return posts;
}

export function getBlogPostBySlug(slug: string): BlogPost | null {
  const posts = getAllBlogPosts();

  const normalizedSlug = slug.replace(/^\/+|\/+$/g, "").replace(/\\/g, "/");

  const found = posts.find((post) => post.slug === normalizedSlug);

  if (!found) {
    console.warn(`❌ Could not find blog post for slug: "${slug}"`);
    console.log("📁 Available posts:");
    posts.forEach((post) => {
      console.log(`  - ${post.slug}`);
    });
  }

  return found || null;
}

export function getBlogPostsByCategory(category: BlogCategory): BlogPost[] {
  const posts = getAllBlogPosts();
  return posts.filter((post) => post.category === category);
}

export function getFeaturedBlogPost(): BlogPost | null {
  const posts = getAllBlogPosts();
  const featuredPost = posts.find((post) => post.featured);

  return featuredPost || posts[0] || null;
}

import path from "path";

export const BLOG_DIRECTORY = path.join(process.cwd(), "src/blog");

// Extract numeric prefix from filename (e.g., "01-introduction.mdx" -> { order: 1, cleanName: "introduction" })
export function extractOrderFromFilename(filename: string): {
  order: number;
  cleanName: string;
} {
  const match = filename.match(/^(\d+)[-_](.+)$/);
  if (match) {
    return {
      order: parseInt(match[1], 10),
      cleanName: match[2],
    };
  }
  return {
    order: 999,
    cleanName: filename,
  };
}

export function generateTitleFromFilename(filename: string): string {
  const { cleanName } = extractOrderFromFilename(filename);
  const nameWithoutExtension = cleanName.replace(/\.(md|mdx)$/, "");
  return nameWithoutExtension
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function generateSlugFromPath(
  basePath: string,
  filename: string
): string {
  const { cleanName } = extractOrderFromFilename(filename);
  const nameWithoutExtension = cleanName.replace(/\.mdx$/, "");
  return nameWithoutExtension;
}
