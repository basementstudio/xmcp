import { Metadata } from "next";
import { HomeHero } from "@/components/home/hero";
import { HomeFeatures } from "@/components/home/features";
import { BuildSection } from "@/components/home/build-section";
import { HomeBlog } from "@/components/home/blog";
import { HomeTestimonials } from "@/components/home/testimonials";
import { getLatestVersion } from "@/lib/get-version";
import { JsonLd } from "@/components/seo/json-ld";
import { getSoftwareApplicationSchema } from "@/lib/structured-data";
import { SITE_URL } from "@/lib/base-url";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "xmcp — The TypeScript MCP framework",
  description:
    "xmcp is the TypeScript framework for building, shipping, and scaling Model Context Protocol servers — tools, prompts, resources, auth, transports, and monetization out of the box.",
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
    <main
      id="main-content"
      className="home-page grid grid-cols-12 gap-x-6 max-w-[1328px] w-full mx-auto px-6"
    >
      <JsonLd data={getSoftwareApplicationSchema(SITE_URL)} />
      <HomeHero version={version} />
      <HomeFeatures />
      <BuildSection />
      <HomeTestimonials />
      <HomeBlog />
    </main>
  );
}
