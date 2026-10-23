import type { MetadataRoute } from "next";

export function docsSearchTitle(title: string, metadataTitle?: string): string {
  return metadataTitle?.trim() || `${title} | xmcp Documentation`;
}

// Only explicit editorial dates belong in the sitemap, never build time.
export function sitemapDate(value: unknown): string | undefined {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
    ? value
    : undefined;
}

export function uniqueSitemap(
  entries: MetadataRoute.Sitemap
): MetadataRoute.Sitemap {
  return [...new Map(entries.map((entry) => [entry.url, entry])).values()];
}
