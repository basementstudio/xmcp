import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logos } from "./logos";
import { McpWorkbench } from "@/components/anatomy/figure";

export function HomeHero({ version }: { version?: string }) {
  return (
    <section className="home-hero">
      <div className="home-hero-top">
        <div>
          <Link
            className="hero-version"
            href="https://npmjs.com/package/xmcp"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>{version ? `v${version}` : "xmcp"}</span> THE TYPESCRIPT MCP
            FRAMEWORK <ArrowRight size={12} />
          </Link>
          <h1>
            Your code.
            <br />
            <span>Connected to AI.</span>
          </h1>
        </div>
        <div className="home-hero-intro">
          <p>
            Turn TypeScript functions into tools, resources, and prompts. xmcp
            handles the protocol, so you can build what makes your server
            useful.
          </p>
          <Link
            className="workbench-button mt-6"
            href="/docs/getting-started/installation"
          >
            Start building <ArrowRight size={15} />
          </Link>
        </div>
      </div>
      <McpWorkbench />
      <div className="hero-trust">
        <p className="eyebrow">Built with xmcp. Trusted by teams at</p>
        <div>
          <Logos.Vercel role="img" aria-label="Vercel" />
          <Logos.Nextjs role="img" aria-label="Next.js" />
          <Logos.Localstack role="img" aria-label="LocalStack" />
          <Logos.Basehub role="img" aria-label="BaseHub" />
        </div>
      </div>
    </section>
  );
}
