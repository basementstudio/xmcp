import Link from "next/link";
import { Code, Pre } from "@/components/markdown/code-blocks";
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
        <div className="editorial-meta">
          <span>Latest version</span>
          <Link
            href="https://npmjs.com/package/xmcp"
            target="_blank"
            rel="noopener noreferrer"
            title="Latest xmcp version on npm (opens in a new tab)"
          >
            {version ? `xmcp · v${version}` : "xmcp · npm"} ↗
          </Link>
        </div>
        <h1>The TypeScript MCP framework</h1>
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
      <Pre>
        <Code className="language-bash">npx create-xmcp-app@latest</Code>
      </Pre>
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
              <h3 className="site-card-title">
                {concept.name}
                <span aria-hidden="true">↗</span>
              </h3>
              <p className="site-card-description">{concept.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
