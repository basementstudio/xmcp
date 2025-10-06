import { getAllBlogPosts } from "../utils/blog";

export const baseUrl = "https://xmcp.dev";

export default async function sitemap() {
  const routes = ["", "/docs", "/blog", "/examples", "/x", "/showcase"].map(
    (route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date().toISOString().split("T")[0],
    })
  );

  // Add blog posts to sitemap
  const blogPosts = getAllBlogPosts();
  const blogRoutes = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.date
      ? new Date(post.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
  }));

  return [...routes, ...blogRoutes];
}
