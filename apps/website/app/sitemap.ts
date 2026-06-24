import { getAllBlogPosts } from "../utils/blog";
import type { MetadataRoute } from "next";
import { source } from "@/lib/source";
import { SITE_URL } from "@/lib/base-url";

export const baseUrl = SITE_URL;

export const revalidate = false;

const toDay = (date: Date): string => date.toISOString().split("T")[0];

export default async function sitemap() {
  const url = (path: string): string => new URL(path, baseUrl).toString();

  const blogPosts = getAllBlogPosts();

  // Most recent content dates, used so top-level routes reflect real updates
  // instead of always showing today's date.
  const latestBlog = blogPosts
    .map((post) => post.date)
    .filter((date): date is string => Boolean(date))
    .sort()
    .at(-1);
  const latestDoc = source
    .getPages()
    .map((page) => page.data.lastModified)
    .filter(Boolean)
    .map((date) => new Date(date as string | Date).getTime())
    .sort((a, b) => a - b)
    .at(-1);

  const lastModifiedFor = (route: string): string => {
    if (route === "/blog" || route === "") {
      return latestBlog ?? toDay(new Date());
    }
    if (route === "/docs") {
      return latestDoc ? toDay(new Date(latestDoc)) : toDay(new Date());
    }
    return toDay(new Date());
  };

  const routes = ["", "/docs", "/blog", "/templates", "/x", "/showcase"].map(
    (route) => ({
      url: url(route),
      lastModified: lastModifiedFor(route),
    })
  );

  // Add blog posts to sitemap
  const blogRoutes = blogPosts.map((post) => ({
    url: url(`/blog/${post.slug}`),
    lastModified: post.date
      ? new Date(post.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    changeFrequency: "weekly",
    priority: 0.8,
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
