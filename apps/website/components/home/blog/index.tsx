import { getAllBlogPosts } from "@/utils/blog";
import { HomeBlogClient } from "./client-index";

export function HomeBlog() {
  const posts = getAllBlogPosts().slice(0, 3);

  return <HomeBlogClient posts={posts} />;
}
