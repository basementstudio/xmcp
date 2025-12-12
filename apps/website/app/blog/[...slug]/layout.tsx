import type { Metadata } from "next";
import { BlogLayout } from "@/components/layout/blog";
import { baseOptions } from "@/lib/layout.shared";
import { blogSource } from "@/lib/source";

export const metadata: Metadata = {
  metadataBase: new URL("https://xmcp.dev"),
  openGraph: {
    siteName: "xmcp",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function Layout({ children }: LayoutProps<"/blog/[...slug]">) {
  return (
    <BlogLayout tree={blogSource.pageTree} {...baseOptions()}>
      {children}
    </BlogLayout>
  );
}
