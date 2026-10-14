import { ArrowTopRightIcon } from "@/components/ui/site-icons";
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
          <Link
            href="https://npmjs.com/package/xmcp"
            className="inline-flex flex-wrap items-baseline gap-x-4 gap-y-2"
            target="_blank"
            rel="noopener noreferrer"
            title={
              version
                ? `xmcp v${version} on npm (opens in a new tab)`
                : "Latest xmcp version on npm (opens in a new tab)"
            }
            aria-label={
              version
                ? `xmcp version ${version} on npm (opens in a new tab)`
                : "xmcp on npm (opens in a new tab)"
            }
          >
            <span>Latest version</span>
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              {version && <span>v{version}</span>}
              <ArrowTopRightIcon />
            </span>
          </Link>
        </div>
        <h1 className="site-page-title">The TypeScript MCP framework</h1>
      </header>
      <div className="editorial-lede">
        <p>
          <span className="text-brand-white">
            Build and ship <code className="site-inline-code">MCP servers</code>{" "}
            with the code you already know.
          </span>{" "}
          <span className="text-brand-neutral-200">
            Give AI applications access to your tools, data, and workflows.
            Write TypeScript functions; xmcp handles the protocol, validation,
            and transport.
          </span>
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
                <ArrowTopRightIcon />
              </h3>
              <p className="site-card-description">{concept.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
