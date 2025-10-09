import { Metadata } from "next";
import { ShowcaseForm } from "../../components/showcase/form";
import { ShowcaseCards } from "../../components/showcase/cards";

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
      <div className="flex-1 pt-10 px-4 lg:px-0 box-content max-w-6xl mx-auto">
        <div className="max-w-[32rem] prose mb-12 text-center sm:text-left">
          <h1 className="text-white uppercase font-medium">
            Community MCP servers
          </h1>
          <p className="text-[#BABABA]">
            Explore the first wave of production-ready MCP servers built by
            developers worldwide.
          </p>
        </div>

        <ShowcaseCards />

        <div className="text-center sm:text-start space-y-4 mx-auto my-12 lg:mt-24">
          <div className="max-w-[40rem] prose">
            <div className="inline-flex items-center px-3 py-1 gap-2 border border-white text-xs font-medium uppercase text-white font-mono">
              <span className="font-bold">⊹</span>Submissions are open
              <span className="font-bold">⊹</span>
            </div>
            <h2 className="mx-auto text-2xl uppercase">
              Showcase your MCP server
            </h2>
            <p className="text-[#BABABA] text-balance">
              Built something amazing with xmcp? Share it with the community and
              get featured in our showcase.
            </p>
          </div>
        </div>

        <ShowcaseForm />
      </div>
    </div>
  );
}
