import { getAllBlogPosts } from "../utils/blog";
import type { MetadataRoute } from "next";
import { source } from "@/lib/source";
import { SITE_URL } from "@/lib/base-url";
import { sitemapDate, uniqueSitemap } from "@/lib/seo";
import { getTemplates } from "@/app/templates/utils/content";
import { collectUniqueCategories } from "@/app/templates/utils/categories";
import { slugifyCategory } from "@/app/templates/utils/slug";

export const baseUrl = SITE_URL;
export const revalidate = 1800;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (path: string) => new URL(path, baseUrl).toString();
  const templates = getTemplates();
  // Collections have no reliable editorial modification date. Omit it rather
  // than implying that a rebuild or an unrelated publication updated them.
  return uniqueSitemap([
    ...[
      "/",
      "/blog",
      "/guides",
      "/templates",
      "/showcase",
      "/faq",
      "/telemetry",
      "/changelog",
    ].map((path) => ({ url: url(path) })),
    ...getAllBlogPosts().map((post) => ({
      url: url(`/blog/${post.slug}`),
      lastModified: sitemapDate(post.data.lastModified),
    })),
    ...source.getPages().map((page) => ({
      url: url(page.url),
      lastModified: sitemapDate(page.data.lastModified),
    })),
    ...templates.map((template) => ({
      url: url(`/templates/${template.slug}`),
    })),
    ...collectUniqueCategories(templates).map((category) => ({
      url: url(`/templates/category/${slugifyCategory(category)}`),
    })),
  ]);
}
