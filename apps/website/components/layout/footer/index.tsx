import Link from "next/link";
import { Icons } from "@/components/icons";

const linkGroups = [
  {
    title: "Build",
    id: "footer-build",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "Installation", href: "/docs/getting-started/installation" },
      { label: "MCP tools", href: "/docs/core-concepts/tools" },
      { label: "Authentication", href: "/docs/guides/authentication" },
      { label: "Starter templates", href: "/templates" },
    ],
  },
  {
    title: "Explore",
    id: "footer-explore",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Showcase", href: "/showcase" },
      { label: "Changelog", href: "/changelog" },
      { label: "Frequently asked questions", href: "/faq" },
    ],
  },
  {
    title: "Community",
    id: "footer-community",
    links: [
      { label: "GitHub", href: "https://github.com/basementstudio/xmcp" },
      { label: "npm package", href: "https://www.npmjs.com/package/xmcp" },
      { label: "Discord", href: "https://discord.gg/d9a7JBBxV9" },
      { label: "X (Twitter)", href: "https://x.com/xmcp_dev" },
      {
        label: "Report an issue",
        href: "https://github.com/basementstudio/xmcp/issues",
      },
    ],
  },
] as const;

const linkClassName =
  "inline-flex min-h-11 items-center py-2 text-brand-neutral-100 underline-offset-4 hover:text-brand-white hover:underline focus-visible:text-brand-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-white rounded-xs";

export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="relative w-full border-t border-brand-neutral-500 bg-brand-black px-4 text-sm text-brand-white">
      <div className="mx-auto max-w-[1408px]">
        <div className="grid gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-20 lg:py-16">
          <div className="max-w-sm">
            <Link
              href="/"
              prefetch={false}
              aria-label="xmcp home"
              className="inline-flex min-h-11 items-center rounded-xs font-mono text-3xl font-medium tracking-tight hover:text-brand-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-white"
            >
              <span translate="no">xmcp</span>
            </Link>
            <p className="mt-4 text-xl leading-snug text-pretty">
              The TypeScript MCP framework.
            </p>
            <p className="mt-3 leading-relaxed text-brand-neutral-100 text-pretty">
              Build and deploy Model Context Protocol (MCP) servers with
              TypeScript. Give AI applications access to your tools, prompts,
              and resources.
            </p>
          </div>
          <div className="grid min-w-0 grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
            {linkGroups.map(({ title, id, links }) => (
              <nav key={id} aria-labelledby={id} className="min-w-0">
                <h2
                  id={id}
                  className="mb-3 font-mono text-xs uppercase tracking-wider"
                >
                  {title}
                </h2>
                <ul>
                  {links.map(({ label, href }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        prefetch={false}
                        className={linkClassName}
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <section
          aria-labelledby="footer-agent-docs"
          className="flex flex-col gap-4 border-y border-brand-neutral-500 py-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8"
        >
          <div>
            <h2 id="footer-agent-docs" className="font-medium">
              Docs for AI agents
            </h2>
            <p className="mt-1 leading-relaxed text-brand-neutral-100">
              Give your assistant the documentation index or the complete
              reference.
            </p>
          </div>
          <ul className="flex flex-col gap-x-8 sm:flex-row">
            <li>
              <a href="/llms.txt" type="text/plain" className={linkClassName}>
                Documentation index{" "}
                <span className="ml-2 font-mono text-xs">.txt</span>
              </a>
            </li>
            <li>
              <a
                href="/llms-full.txt"
                type="text/plain"
                className={linkClassName}
              >
                Full documentation{" "}
                <span className="ml-2 font-mono text-xs">.txt</span>
              </a>
            </li>
          </ul>
        </section>
        <div className="flex flex-col gap-3 pt-6 pb-[max(5rem,env(safe-area-inset-bottom))] text-brand-neutral-100 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-8 sm:pb-8">
          <p>© {year} xmcp. All rights reserved.</p>
          <Link href="/telemetry" prefetch={false} className={linkClassName}>
            Telemetry
          </Link>
          <a href="https://vercel.com/oss" className={`${linkClassName} gap-2`}>
            <Icons.vercel aria-hidden="true" className="size-3.5 shrink-0" />
            Vercel Open Source Program
          </a>
        </div>
      </div>
    </footer>
  );
};
