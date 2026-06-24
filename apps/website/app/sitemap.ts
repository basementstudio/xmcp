import { getAllBlogPosts } from "../utils/blog";
import type { MetadataRoute } from "next";
import { source } from "@/lib/source";
import { SITE_URL } from "@/lib/base-url";
import { fetchTemplates } from "@/app/templates/utils/github";
import { collectUniqueCategories } from "@/app/templates/utils/categories";
import { slugifyCategory } from "@/app/templates/utils/slug";

export const baseUrl = SITE_URL;

export const revalidate = 1800;

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

  const routes = ["", "/docs", "/blog", "/templates", "/showcase", "/telemetry"].map(
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

  const templates = await fetchTemplates();

  const templateRoutes: MetadataRoute.Sitemap[number][] = templates.map(
    (template) => ({
      url: url(`/templates/${template.slug}`),
      lastModified: lastModifiedFor(`/templates/${template.slug}`),
      changeFrequency: "weekly",
      priority: 0.7,
    })
  );

  const templateCategoryRoutes: MetadataRoute.Sitemap[number][] =
    collectUniqueCategories(templates).map((category) => ({
      url: url(`/templates/category/${slugifyCategory(category)}`),
      lastModified: lastModifiedFor("/templates"),
      changeFrequency: "weekly",
      priority: 0.6,
    }));

  return [
    ...routes,
    ...blogRoutes,
    ...docRoutes,
    ...templateRoutes,
    ...templateCategoryRoutes,
  ];
}
