import fs from "fs";
import matter from "gray-matter";

export type BlogCategory = "changelog" | "guides" | "engineering";

export interface BlogAuthor {
  readonly id: string;
  readonly name: string;
  readonly profilePicture: string;
  readonly xHandle: string;
  readonly xUrl: string;
  readonly role?: string;
}

const DEFAULT_AUTHOR_ID = "valebearzotti";

export const BLOG_AUTHORS: Record<string, BlogAuthor> = {
  [DEFAULT_AUTHOR_ID]: {
    id: DEFAULT_AUTHOR_ID,
    name: "Valentina Bearzotti",
    profilePicture: "/blog/authors/valebearzotti.png",
    xHandle: "@valebearzotti",
    xUrl: "https://x.com/valebearzotti",
    role: "Creator & Tech Lead",
  },
  fveiras_: {
    id: "fveiras_",
    name: "Francisco Veiras",
    profilePicture: "/blog/authors/fveiras_.png",
    xHandle: "@fveiras_",
    xUrl: "https://x.com/fveiras_",
    role: "Core Maintainer",
  },
  "0xkoller": {
    id: "0xkoller",
    name: "Jose Luis Koller",
    profilePicture: "/blog/authors/0xkoller.png",
    xHandle: "@0xkoller",
    xUrl: "https://x.com/0xkoller",
    role: "DX Engineer",
  },
};

export function resolveAuthors(authors?: unknown): BlogAuthor[] {
  const ids =
    typeof authors === "string"
      ? [authors]
      : Array.isArray(authors)
        ? authors
        : [];

  const normalizedIds = ids.filter(
    (id): id is string => typeof id === "string" && id.trim().length > 0
  );

  const finalIds =
    normalizedIds.length > 0 ? normalizedIds : [DEFAULT_AUTHOR_ID];

  const fallback = BLOG_AUTHORS[DEFAULT_AUTHOR_ID];

  return finalIds.map((id) => {
    const author = BLOG_AUTHORS[id];
    if (author) return author;

    return {
      ...fallback,
      id,
    };
  });
}

export interface BlogFrontmatter {
  readonly title?: string;
  readonly description?: string;
  readonly summary?: string;
  readonly date?: string;
  readonly category?: BlogCategory;
  readonly order?: number;
  readonly featured?: boolean;
  readonly previewImage?: string;
  readonly textureImage?: string;
  readonly authors?: string[];
  readonly [key: string]: unknown;
}

export interface BlogPost {
  readonly slug: string;
  readonly title: string;
  readonly content: string;
  readonly data: BlogFrontmatter;
  readonly path: string;
  readonly order: number;
  readonly category: BlogCategory;
  readonly date?: string;
  readonly description?: string;
  readonly summary?: string;
  readonly featured?: boolean;
  readonly previewImage?: string;
  readonly textureImage?: string;
  readonly authors: BlogAuthor[];
}

export interface BlogMetadata {
  readonly title: string;
  readonly description: string;
  readonly summary: string | undefined;
  readonly date: string | undefined;
  readonly ogImageUrl: string;
  readonly authors: BlogAuthor[];
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
      if (
        data.category &&
        ["changelog", "guides", "engineering"].includes(data.category)
      ) {
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
        summary: data.summary,
        featured: data.featured || false,
        previewImage: data.previewImage,
        textureImage: data.textureImage,
        authors: resolveAuthors(data.authors),
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

/**
 * Get metadata for a blog post, suitable for generating page metadata and OG images.
 */
export function getBlogMetadata(
  slug: string,
  baseUrl: string
): BlogMetadata | null {
  const post = getBlogPostBySlug(slug);
  if (!post) return null;

  return {
    title: post.title,
    description: post.description ?? "",
    summary: post.summary,
    date: post.date,
    ogImageUrl: post.previewImage
      ? `${baseUrl}${post.previewImage}`
      : `${baseUrl}/api/og/blog/${slug}`,
    authors: post.authors,
  };
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

export const BLOG_DIRECTORY = path.join(process.cwd(), "content/blog");

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
