import { AllYouNeedIsToolsSection } from "./sections/all-you-need-is-tools";
import { FeaturesSection } from "./sections/features-section";
import { GetStartedSection } from "./sections/get-started-section";
import { Metadata } from "next";
import { HomeHero } from "@/components/home/hero";

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
    <div className="flex flex-col max-w-[1440px] w-full mx-auto px-4">
      <HomeHero />
      <div
        className="flex flex-col"
        style={{
          gap: "calc(var(--spacing) * 30)",
        }}
      >
        <AllYouNeedIsToolsSection />
        <FeaturesSection />
        <GetStartedSection />
      </div>
    </div>
  );
}
