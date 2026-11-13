import { DEFAULT_OG_IMAGE, DEFAULT_TWITTER_IMAGE } from "@/lib/social-image";
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
  title: "MCP Server Examples and Community Showcase | xmcp",
  description:
    "Browse production-ready MCP servers built by the xmcp community and submit your own server to be featured in the showcase alongside other developers building AI tooling.",
  alternates: {
    canonical: "https://xmcp.dev/showcase",
  },
  openGraph: {
    title: "MCP Server Examples and Community Showcase | xmcp",
    description:
      "Browse production-ready MCP servers built by the xmcp community and submit your own server to be featured in the showcase alongside other developers building AI tooling.",
    url: "https://xmcp.dev/showcase",
    siteName: "xmcp",
    type: "website",
    locale: "en_US",
    images: DEFAULT_OG_IMAGE,
  },
  twitter: {
    card: "summary_large_image",
    title: "MCP Server Examples and Community Showcase | xmcp",
    description:
      "Browse production-ready MCP servers built by the xmcp community and submit your own server to be featured in the showcase alongside other developers building AI tooling.",
    images: DEFAULT_TWITTER_IMAGE,
  },
};

export default function ShowcasePage() {
  const mcps = getShowcaseItems();

  return (
    <main id="main-content" className="site-page-grid">
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
      <div className="site-listing">
        <div className="listing-intro">
          <p className="eyebrow">Made with xmcp / Showcase</p>
          <h1 className="display">Community MCP servers</h1>
          <p className="listing-description">
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
