import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { Toolbar } from "basehub/next-toolbar";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import localFont from "next/font/local";
import { Geist } from "next/font/google";
import { Metadata } from "next";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const geistMono = localFont({
  variable: "--font-mono",
  src: [
    {
      path: "./fonts/GeistMono-Thin.woff2",
      weight: "100",
      style: "normal",
    },
    {
      path: "./fonts/GeistMono-ThinItalic.woff2",
      weight: "100",
      style: "italic",
    },
    {
      path: "./fonts/GeistMono-ExtraLight.woff2",
      weight: "200",
      style: "normal",
    },
    {
      path: "./fonts/GeistMono-ExtraLightItalic.woff2",
      weight: "200",
      style: "italic",
    },
    {
      path: "./fonts/GeistMono-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/GeistMono-LightItalic.woff2",
      weight: "300",
      style: "italic",
    },
    {
      path: "./fonts/GeistMono-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/GeistMono-Italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "./fonts/GeistMono-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/GeistMono-MediumItalic.woff2",
      weight: "500",
      style: "italic",
    },
    {
      path: "./fonts/GeistMono-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/GeistMono-SemiBoldItalic.woff2",
      weight: "600",
      style: "italic",
    },
    {
      path: "./fonts/GeistMono-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/GeistMono-BoldItalic.woff2",
      weight: "700",
      style: "italic",
    },
    {
      path: "./fonts/GeistMono-ExtraBold.woff2",
      weight: "800",
      style: "normal",
    },
    {
      path: "./fonts/GeistMono-ExtraBoldItalic.woff2",
      weight: "800",
      style: "italic",
    },
    {
      path: "./fonts/GeistMono-Black.woff2",
      weight: "900",
      style: "normal",
    },
    {
      path: "./fonts/GeistMono-BlackItalic.woff2",
      weight: "900",
      style: "italic",
    },
  ],
});

const slack = localFont({
  variable: "--font-slack",
  src: [
    {
      path: "./fonts/Slack-Light.otf",
    },
  ],
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
        className={`${geist.variable} ${geistMono.variable} ${slack.variable} antialiased min-h-[100dvh] flex flex-col max-w-[1400px] mx-auto`}
      >
        <div className="grow relative">
          <Header />
          {children}
          <Footer />
        </div>
        <Toolbar />
        <Analytics />
      </body>
    </html>
  );
}
