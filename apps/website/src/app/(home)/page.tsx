import { IntroSection } from "./sections/intro-section";
import { AllYouNeedIsToolsSection } from "./sections/all-you-need-is-tools";
import { FeaturesSection } from "./sections/features-section";
import { GetStartedSection } from "./sections/get-started-section";
import { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "xmcp — The TypeScript MCP framework",
  description: "The framework for building & shipping MCP applications.",
  alternates: {
    canonical: "https://xmcp.dev",
  },
};

export default async function Home() {
  return (
    <div className="font-mono min-h-[calc(100vh-12rem)] flex justify-center">
      <div className="max-w-[700px] w-full mx-auto text-center flex flex-col px-8">
        <IntroSection />
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
    </div>
  );
}
