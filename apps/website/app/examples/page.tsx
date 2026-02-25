import { Metadata } from "next";
import { getBaseUrl } from "@/lib/base-url";
import { fetchExamplesAndTemplates } from "@/app/examples/utils/github";
import { ExamplesPageContent } from "@/components/examples/page-content";

export const dynamic = "force-static";

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  title: "Examples - xmcp",
  description:
    "Explore examples and templates to get started with xmcp. Learn from real-world implementations and best practices.",
  alternates: {
    canonical: `${baseUrl}/examples`,
  },
  openGraph: {
    title: "Examples & templates - xmcp",
    description:
      "Explore examples and templates to get started with xmcp. Learn from real-world implementations and best practices.",
    siteName: "xmcp",
    type: "website",
    locale: "en_US",
    url: `${baseUrl}/examples`,
    images: {
      url: `${baseUrl}/api/og/examples`,
      width: 1200,
      height: 630,
    },
  },
  twitter: {
    card: "summary_large_image",
    title: "Examples & templates - xmcp",
    description:
      "Explore examples and templates to get started with xmcp. Learn from real-world implementations and best practices.",
    images: {
      url: `${baseUrl}/api/og/examples`,
      width: 1200,
      height: 630,
    },
  },
};

export default async function ExamplesPage() {
  const examples = await fetchExamplesAndTemplates();

  return (
    <main className="grid grid-cols-12 gap-[20px] max-w-[1200px] w-full mx-auto px-4">
      <ExamplesPageContent examples={examples} />
    </main>
  );
}
