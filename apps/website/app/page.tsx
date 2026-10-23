import { Metadata } from "next";
import { HomeHero } from "@/components/home/hero";
import { HomeFeatures } from "@/components/home/features";
import { HomeSteps } from "@/components/home/steps";
import { HomeBlog } from "@/components/home/blog";
import { getLatestVersion } from "@/lib/get-version";
import { JsonLd } from "@/components/seo/json-ld";
import { getSoftwareApplicationSchema } from "@/lib/structured-data";
import { SITE_URL } from "@/lib/base-url";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "xmcp — The TypeScript MCP framework",
  description:
    "Build MCP servers in TypeScript with file-based tools, Zod validation, authentication integrations, and HTTP or STDIO transports. Start with xmcp.",
  alternates: {
    canonical: "https://xmcp.dev",
    types: {
      "text/markdown": "https://xmcp.dev/index.md",
    },
  },
};

export default async function Home() {
  const version = await getLatestVersion();

  return (
    <main id="main-content" className="site-page-grid home-page">
      <JsonLd data={getSoftwareApplicationSchema(SITE_URL)} />
      <HomeHero version={version} />
      <HomeFeatures />
      <HomeSteps />
      <HomeBlog />
    </main>
  );
}
