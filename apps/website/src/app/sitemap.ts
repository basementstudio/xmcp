export const baseUrl = "https://xmcp.dev";

export default async function sitemap() {
  const routes = ["", "/docs", "/x", "/showcase"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split("T")[0],
  }));

  return [...routes];
}
