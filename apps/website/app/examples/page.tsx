import { Metadata } from "next";
import { ExampleCardsList } from "../../components/examples/cards/list";
import { getBaseUrl } from "@/lib/base-url";

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

export default function ExamplesPage() {
  return (
    <main className="grid grid-cols-12 gap-[20px] max-w-[1200px] w-full mx-auto px-4">
      <div className="col-span-12 grid grid-cols-12 gap-[20px] py-8 md:py-16">
        <div className="flex flex-col items-center justify-center max-w-[720px] w-full mx-auto gap-4 col-span-12 mb-8">
          <h1 className="display text-center text-balance z-10 text-gradient">
            Examples & templates
          </h1>
          <p className="text-brand-neutral-100 text-base col-span-12 max-w-[650px] lg:col-span-5 mt-auto text-center">
            Quickstart guides and examples to get you started with xmcp with
            real-world implementations and best practices.
          </p>
        </div>
        <ExampleCardsList />
      </div>
    </main>
  );
}
