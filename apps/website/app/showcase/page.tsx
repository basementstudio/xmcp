import { Metadata } from "next";
import { ShowcaseForm } from "../../components/showcase/form";
import { ShowcaseCards } from "../../components/showcase/cards";
import { ShowcaseHeroHeading } from "@/components/showcase/index/showcase-hero-heading";
import { ShowcaseSubmissionsHeading } from "@/components/showcase/index/showcase-submissions-heading";

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
            <ShowcaseSubmissionsHeading />

            <div className="col-span-12">
              <ShowcaseForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
