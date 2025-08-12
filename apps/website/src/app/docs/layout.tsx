import { Sidebar } from "@/components/layout/sidebar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "xmcp — Documentation",
  description: "The documentation for the xmcp framework.",
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
    url: "https://xmcp.dev",
    type: "website",
    locale: "en_US",
    title: "xmcp — Documentation",
    description: "The documentation for the xmcp framework.",
  },
  twitter: {
    card: "summary_large_image",
    title: "xmcp — Documentation",
    description: "The documentation for the xmcp framework.",
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
    canonical: "https://xmcp.dev/docs",
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <div className="flex-1 flex justify-center">
        <div className="w-full max-w-[700px]">{children}</div>
      </div>
    </>
  );
}
