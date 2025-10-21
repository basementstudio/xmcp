import { Metadata } from "next";
import { ShowcaseForm } from "../../components/showcase/form";
import { ShowcaseCards } from "../../components/showcase/cards";
import { Tag } from "@/components/ui/tag";
import { ShowcaseHeroHeading } from "@/components/showcase/index/showcase-hero-heading";

export const metadata: Metadata = {
  title: "Showcase - xmcp",
  description:
    "Join the xmcp showcase program and share your MCP servers with the community.",
  alternates: {
    canonical: "https://xmcp.dev/showcase",
  },
};

export default function ShowcasePage() {
  return (
    <div className="grid grid-cols-12 gap-[20px] max-w-[1200px] w-full mx-auto px-4">
      <div className="col-span-12 grid grid-cols-12 gap-[20px] py-8 md:py-16">
        <div className="flex flex-col items-center justify-center max-w-[720px] w-full mx-auto gap-4 col-span-12 mb-8">
          <ShowcaseHeroHeading />
        </div>

        <ShowcaseCards />

        <div className="col-span-12 py-8 md:py-16">
          <div className="col-span-12 grid grid-cols-12 gap-[20px] py-8 md:py-16">
            <div className="flex flex-col items-start justify-center col-span-12 lg:col-span-9 lg:col-start-2 w-full mx-auto mb-8 gap-3">
              <Tag text="Submissions are open" />
              <div className="grid grid-cols-12 lg:grid-cols-9 gap-4 md:gap-8 w-full">
                <h2 className="heading-2 text-balance col-span-12 lg:col-span-4 mt-auto text-gradient">
                  Showcase your MCP server
                </h2>
                <p className="text-brand-neutral-100 text-base col-span-12 max-w-[650px] lg:col-span-5 mt-auto">
                  Built something amazing with xmcp? Share it with the community
                  and get featured in our showcase.
                </p>
              </div>
            </div>

            <div className="col-span-12">
              <ShowcaseForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
