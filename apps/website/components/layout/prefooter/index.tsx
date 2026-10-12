import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export const Prefooter = () => (
  <section className="site-cta mx-auto w-full max-w-[1328px] px-6 py-20 md:py-28">
    <div className="flex flex-col gap-8 border-t border-brand-neutral-500 pt-12 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="eyebrow mb-4">From an idea to an MCP server</p>
        <h2 className="heading-1 max-w-[600px]">
          Give your next idea
          <br />a working interface.
        </h2>
      </div>
      <Link
        href="/docs/getting-started/installation"
        className="workbench-button"
      >
        Start building <ArrowUpRight size={16} />
      </Link>
    </div>
  </section>
);
