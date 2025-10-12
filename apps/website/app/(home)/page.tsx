import { Metadata } from "next";
import { HomeHero } from "@/components/home/hero";
import { Features } from "@/components/home/features";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "xmcp — The TypeScript MCP framework",
  description: "The framework for building & shipping MCP servers.",
  alternates: {
    canonical: "https://xmcp.dev",
  },
};

export default async function Home() {
  return (
    <div className="grid grid-cols-12 gap-[20px] max-w-[1200px] w-full mx-auto px-4">
      <HomeHero />
      <Features />
      {/* <div
        className="flex flex-col"
        style={{
          gap: "calc(var(--spacing) * 30)",
        }}
      >
        <AllYouNeedIsToolsSection />
        <FeaturesSection />
        <GetStartedSection />
      </div> */}
    </div>
  );
}
