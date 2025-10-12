import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { Toolbar } from "basehub/next-toolbar";
import { Footer } from "../components/layout/footer";
import { Header } from "../components/layout/header";
import { Metadata } from "next";
import { RootProvider } from "fumadocs-ui/provider";
import DefaultSearchDialog from "@/components/search/search-default";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "xmcp — The TypeScript MCP framework",
  description: "The framework for building & shipping MCP applications.",
  robots: {
    index: true,
    follow: true,
  },
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
    title: "xmcp — The TypeScript MCP framework",
    description: "The framework for building & shipping MCP applications.",
  },
  twitter: {
    card: "summary_large_image",
    title: "xmcp — The TypeScript MCP framework",
    description: "The framework for building & shipping MCP applications.",
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
    canonical: "https://xmcp.dev",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#000000" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-[100dvh] flex flex-col`}
      >
        <RootProvider
          search={{
            SearchDialog: DefaultSearchDialog,
            options: {
              links: [
                ["Getting Started", "/docs/getting-started/introduction"],
                ["Configuration", "/docs/configuration/custom-directories"],
                ["Core Concepts", "/docs/core-concepts/tools"],
                ["Authentication", "/docs/authentication/api-key"],
                ["Integrations", "/docs/integrations/nextjs"],
                ["Deployment", "/docs/deployment/vercel"],
              ],
            },
          }}
        >
          <Header />
          {children}
          <Footer />
        </RootProvider>
        {/* <Toolbar /> */}
        <Analytics />
      </body>
    </html>
  );
}
