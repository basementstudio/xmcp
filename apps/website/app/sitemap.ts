import { getAllBlogPosts } from "../utils/blog";
import type { MetadataRoute } from "next";
import { source } from "@/lib/source";

export const baseUrl = "https://xmcp.dev";

export const revalidate = false;

export default async function sitemap() {
  const url = (path: string): string => new URL(path, baseUrl).toString();

  const routes = ["", "/docs", "/blog", "/examples", "/x", "/showcase"].map(
    (route) => ({
      url: url(route),
      lastModified: new Date().toISOString().split("T")[0],
    })
  );

  // Add blog posts to sitemap
  const blogPosts = getAllBlogPosts();
  const blogRoutes = blogPosts.map((post) => ({
    url: url(`/blog/${post.slug}`),
    lastModified: post.date
      ? new Date(post.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
  }));

  const docRoutes = source.getPages().flatMap((page) => {
    const { lastModified } = page.data;

    return {
      url: url(page.url),
      lastModified: lastModified ? new Date(lastModified) : undefined,
      changeFrequency: "weekly",
      priority: 0.5,
    } as MetadataRoute.Sitemap[number];
  });

  return [...routes, ...blogRoutes, ...docRoutes];
}
