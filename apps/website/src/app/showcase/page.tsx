import { Metadata } from "next";
import { ShowcaseForm } from "@/components/showcase/form";

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
      <div className="max-w-[700px] w-full mx-auto flex flex-col px-8 py-16">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center px-3 py-1 gap-2 border border-white text-xs font-medium uppercase text-white">
            <span className="font-bold">⊹</span>Submissions are open
            <span className="font-bold">⊹</span>
          </div>
          <h1 className="max-w-[30rem] mx-auto text-2xl">
            Showcase your MCP server
          </h1>
          <p className="text-[#BABABA] text-[1rem] text-balance">
            Built something amazing with xmcp? Share it with the community and
            get featured in our showcase.
          </p>
        </div>

        <div className="border border-white p-8">
          <ShowcaseForm />
        </div>

        <div className="mt-16 space-y-8">
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
        </div>
      </div>
    </div>
  );
}
