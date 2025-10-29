import { Metadata } from "next";
import { HomeHero } from "@/components/home/hero";
import { HomeFeatures } from "@/components/home/features";
import { HomeSteps } from "@/components/home/steps";
import { HomeBlog } from "@/components/home/blog";
import { getLatestVersion } from "@/lib/get-version";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "xmcp — The TypeScript MCP framework",
  description: "The framework for building & shipping MCP servers.",
  alternates: {
    canonical: "https://xmcp.dev",
  },
};

export default async function Home() {
  const version = await getLatestVersion();

  return (
    <div className="grid grid-cols-12 gap-[20px] max-w-[1200px] w-full mx-auto px-4">
      <HomeHero version={version} />
      <HomeFeatures />
      <HomeSteps />
      <HomeBlog />
    </div>
  );
}
