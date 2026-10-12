import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function BuildSection() {
  return (
    <section className="build-section">
      <div className="build-copy">
        <p className="eyebrow">02 / From your terminal to a tool call</p>
        <h2 className="heading-2">
          Small starting point.
          <br />
          Plenty of possibility.
        </h2>
        <p>
          Scaffold a project, write your first function, and connect an MCP
          client. A familiar TypeScript workflow, with the protocol taken care
          of.
        </p>
        <Link
          href="/docs/getting-started/installation"
          className="workbench-button"
        >
          Create your first server <ArrowRight size={15} />
        </Link>
      </div>
      <div className="build-terminal">
        <p className="eyebrow mb-5">Terminal / new project</p>
        <code>npx create-xmcp-app@latest</code>
        <pre>{`my-mcp-server/
├── src/
│   ├── tools/       # Functions to call
│   ├── resources/   # Context to read
│   └── prompts/     # Instructions to reuse
├── xmcp.config.ts
└── package.json`}</pre>
      </div>
    </section>
  );
}
