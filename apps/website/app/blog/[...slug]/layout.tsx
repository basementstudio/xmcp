import { BlogSidebar } from "../../../components/blog/sidebar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog - xmcp",
  description: "Latest updates, guides, and insights about xmcp",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    siteName: "xmcp",
    images: {
      url: "/xmcp-og.png",
      width: 1200,
      height: 630,
    },
    url: "https://xmcp.dev/blog",
    type: "website",
    locale: "en_US",
    title: "Blog - xmcp",
    description: "Latest updates, guides, and insights about xmcp",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog - xmcp",
    description: "Latest updates, guides, and insights about xmcp",
    images: {
      url: "/xmcp-og.png",
      width: 1200,
      height: 630,
    },
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    title: "xmcp",
  },
  alternates: {
    canonical: "https://xmcp.dev/blog",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BlogSidebar />
      <div className="flex-1 flex justify-center">
        <div className="w-full max-w-[700px] px-4 sm:px-6 lg:px-0">
          {children}
        </div>
      </div>
    </>
  );
}
