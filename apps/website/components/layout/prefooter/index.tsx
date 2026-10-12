import Link from "next/link";

export const Prefooter = () => (
  <section className="site-cta">
    <div className="editorial-section-head">
      <h2>Start building</h2>
    </div>
    <p>Build your first MCP server, or start with a working template.</p>
    <div className="editorial-meta">
      <Link href="/docs">Read the documentation ↗</Link>
      <Link href="/templates">Explore templates ↗</Link>
    </div>
  </section>
);
