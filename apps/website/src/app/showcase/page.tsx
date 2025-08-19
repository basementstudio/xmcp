import { Metadata } from "next";
import { ShowcaseForm } from "@/components/showcase/form";
import { ShowcaseCards } from "@/components/showcase/cards";

export const dynamic = "force-static";

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
    <div className="font-mono min-h-[calc(100vh-12rem)] flex justify-center">
      <div className="max-w-[1100px] w-full mx-auto flex flex-col px-8 py-16 gap-16">
        <div className="text-center max-w-[40rem] mx-auto">
          <h1 className="text-2xl font-medium tracking-tight text-white mb-4">
            Discover MCP servers from the community
          </h1>
          <p className="text-[#BABABA] text-[1rem]">
            Explore the first wave of production-ready MCP servers built by
            developers worldwide.
          </p>
        </div>

        <ShowcaseCards />

        <div className="text-center space-y-4 max-w-[40rem] mx-auto mt-16">
          <div className="inline-flex items-center px-3 py-1 gap-2 border border-white text-xs font-medium uppercase text-white">
            <span className="font-bold">⊹</span>Submissions are open
            <span className="font-bold">⊹</span>
          </div>
          <h2 className="mx-auto text-2xl">Showcase your MCP server</h2>
          <p className="text-[#BABABA] text-[1rem] text-balance">
            Built something amazing with xmcp? Share it with the community and
            get featured in our showcase.
          </p>
        </div>

        <ShowcaseForm />

        {/* <div className="mt-16 space-y-8">
          <div className="text-center">
            <h2 className="text-xl font-medium tracking-tight text-white mb-4">
              How does the submission process work?
            </h2>
          </div>

          <p className="text-[#BABABA] text-[1rem] leading-relaxed text-center">
            The selection process is manual and curated. We evaluate submissions
            based on tool innovation, implementation quality, and community
            value. Both open source and proprietary servers are welcome.
          </p>
        </div> */}
      </div>
    </div>
  );
}
