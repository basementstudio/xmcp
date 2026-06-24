import { Metadata } from "next";
import { HomeHero } from "@/components/home/hero";
import { HomeFeatures } from "@/components/home/features";
import { HomeSteps } from "@/components/home/steps";
import { HomeBlog } from "@/components/home/blog";
import { HomeTestimonials } from "@/components/home/testimonials";
import { getLatestVersion } from "@/lib/get-version";
import { FaqBlock } from "@/components/seo/faq-block";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "xmcp — The TypeScript MCP framework",
  description:
    "xmcp is the TypeScript framework for building, shipping, and scaling Model Context Protocol servers — tools, prompts, resources, auth, transports, and monetization out of the box.",
  alternates: {
    canonical: "https://xmcp.dev",
  },
};

export default async function Home() {
  const version = await getLatestVersion();

  return (
    <main className="grid grid-cols-12 gap-[20px] max-w-[1200px] w-full mx-auto px-4">
      <HomeHero version={version} />
      <HomeFeatures />
      <HomeSteps />
      <HomeTestimonials />
      <HomeBlog />
      <FaqBlock />
    </main>
  );
}
