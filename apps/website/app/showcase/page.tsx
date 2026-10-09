import { Metadata } from "next";
import { ShowcaseCards } from "@/components/showcase/cards";
import { ShowcaseSubmissionCard } from "@/components/showcase/submission-card";
import { getShowcaseItems } from "@/utils/content";
import { JsonLd } from "@/components/seo/json-ld";
import {
  getBreadcrumbSchema,
  getShowcaseItemListSchema,
} from "@/lib/structured-data";
import { SITE_URL } from "@/lib/base-url";

export const metadata: Metadata = {
  title: "Showcase - xmcp",
  description:
    "Browse production-ready MCP servers built by the xmcp community and submit your own server to be featured in the showcase alongside other developers building AI tooling.",
  alternates: {
    canonical: "https://xmcp.dev/showcase",
  },
  openGraph: {
    title: "Showcase - xmcp",
    description:
      "Browse production-ready MCP servers built by the xmcp community and submit your own server to be featured in the showcase alongside other developers building AI tooling.",
    url: "https://xmcp.dev/showcase",
    siteName: "xmcp",
    type: "website",
    locale: "en_US",
    images: {
      url: "/xmcp-og.png",
      width: 1200,
      height: 630,
    },
  },
  twitter: {
    card: "summary_large_image",
    title: "Showcase - xmcp",
    description:
      "Browse production-ready MCP servers built by the xmcp community and submit your own server to be featured in the showcase alongside other developers building AI tooling.",
    images: "/xmcp-og.png",
  },
};

export default function ShowcasePage() {
  const mcps = getShowcaseItems();

  return (
    <main
      id="main-content"
      className="grid grid-cols-12 gap-[20px] max-w-[1200px] w-full mx-auto px-4"
    >
      <JsonLd
        data={[
          getShowcaseItemListSchema(mcps, SITE_URL),
          getBreadcrumbSchema(
            [
              { name: "Home", url: "/" },
              { name: "Showcase", url: "/showcase" },
            ],
            SITE_URL
          ),
        ]}
      />
      <div className="col-span-12 grid grid-cols-12 gap-[20px] py-8 md:py-16">
        <div className="flex flex-col items-center justify-center max-w-[720px] w-full mx-auto gap-4 col-span-12 mb-8">
          <h1 className="display text-center text-balance z-10 text-gradient">
            Community MCP servers
          </h1>
          <p className="text-brand-neutral-100 text-base col-span-12 max-w-[650px] lg:col-span-5 mt-auto text-center">
            Explore the first wave of production-ready MCP servers built by
            developers worldwide.
          </p>
        </div>

        <ShowcaseCards mcps={mcps} />

        <ShowcaseSubmissionCard />
      </div>
    </main>
  );
}
