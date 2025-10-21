import { BlogLayout } from "@/components/layout/blog";
import { baseOptions } from "@/lib/layout.shared";
import { blogSource } from "@/lib/source";

export default function Layout({ children }: LayoutProps<"/blog/[...slug]">) {
  return (
    <BlogLayout tree={blogSource.pageTree} {...baseOptions()}>
      {children}
    </BlogLayout>
  );
}
