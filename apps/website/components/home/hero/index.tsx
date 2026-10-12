import Link from "next/link";
import { CopyButton } from "@/components/ui/copy-button";
import Shader from "./shader";

const concepts = [
  {
    name: "Tools",
    description: "Functions that let AI applications take action.",
    href: "/docs/core-concepts/tools",
  },
  {
    name: "Resources",
    description: "Data and context for a model to read.",
    href: "/docs/core-concepts/resources",
  },
  {
    name: "Prompts",
    description: "Reusable starting points for a conversation.",
    href: "/docs/core-concepts/prompts",
  },
];

export function HomeHero({ version }: { version?: string }) {
  return (
    <section className="home-hero">
      <header className="editorial-masthead">
        <h1>The TypeScript MCP framework</h1>
        <div className="editorial-meta">
          <Link href="https://npmjs.com/package/xmcp">
            {version ? `xmcp · v${version}` : "xmcp · npm"}
          </Link>
          <span>Open source</span>
          <Link href="/docs">Get started ↗</Link>
        </div>
      </header>
      <div className="editorial-lede">
        <p>
          <em>Build and ship MCP servers with the code you already know.</em>{" "}
          Give AI applications access to your tools, data, and workflows. Write
          TypeScript functions; xmcp handles the protocol, validation, and
          transport.
        </p>
      </div>
      <Shader />
      <div className="editorial-command">
        <span aria-hidden="true">$</span>
        <code>npx create-xmcp-app@latest</code>
        <CopyButton
          text="npx create-xmcp-app@latest"
          className="relative top-auto right-auto shrink-0 size-6"
        />
      </div>
      <section id="concepts" className="editorial-section">
        <div className="editorial-section-head">
          <h2>Core concepts</h2>
          <span aria-hidden="true">I</span>
        </div>
        <p className="editorial-section-intro">
          Three primitives connect your application to an AI client. Explore
          each one in the docs.
        </p>
        <div className="concept-cards">
          {concepts.map((concept) => (
            <Link
              className="concept-card"
              href={concept.href}
              key={concept.name}
            >
              <h3>
                {concept.name}
                <span aria-hidden="true">↗</span>
              </h3>
              <p>{concept.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
