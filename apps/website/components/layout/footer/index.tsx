import Link from "next/link";
import { DiscordLogoIcon, GitHubLogoIcon } from "@radix-ui/react-icons";
import { ArrowUpRight, CircleDot } from "lucide-react";
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
      {
        label: "GitHub",
        href: "https://github.com/basementstudio/xmcp",
        icon: GitHubLogoIcon,
      },
      {
        label: "npm package",
        href: "https://www.npmjs.com/package/xmcp",
        icon: Icons.npm,
      },
      {
        label: "Discord",
        href: "https://discord.gg/d9a7JBBxV9",
        icon: DiscordLogoIcon,
      },
      { label: "X (Twitter)", href: "https://x.com/xmcp_dev", icon: Icons.x },
      {
        label: "Report an issue",
        href: "https://github.com/basementstudio/xmcp/issues",
        icon: CircleDot,
      },
    ],
  },
] as const;

const linkClassName =
  "link-underline-group inline-flex min-h-11 items-center gap-2 py-2 text-brand-neutral-100 hover:text-brand-white focus-visible:text-brand-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-white rounded-xs";

export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="relative w-full bg-brand-black px-4 text-sm text-brand-white">
      <div className="mx-auto max-w-[1408px]">
        <div className="grid gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-20 lg:py-16">
          <div className="max-w-sm">
            <Link
              href="/"
              prefetch={false}
              aria-label="xmcp home"
              className="link-underline-group inline-flex min-h-11 items-center rounded-xs font-mono text-3xl font-medium tracking-tight hover:text-brand-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-white"
            >
              <span translate="no" className="link-underline-label">
                xmcp
              </span>
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
                  {links.map((link) => {
                    const external = link.href.startsWith("https://");
                    const Icon = "icon" in link ? link.icon : undefined;
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          prefetch={false}
                          target={external ? "_blank" : undefined}
                          rel={external ? "noopener noreferrer" : undefined}
                          className={linkClassName}
                        >
                          {Icon && (
                            <Icon
                              aria-hidden="true"
                              className="size-4 shrink-0"
                            />
                          )}
                          <span className="link-underline-label">
                            {link.label}
                          </span>
                          {external && (
                            <>
                              <ArrowUpRight
                                aria-hidden="true"
                                className="size-3 shrink-0"
                              />
                              <span className="sr-only">
                                {" "}
                                (opens in a new tab)
                              </span>
                            </>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-brand-neutral-500 pt-6 pb-[max(5rem,env(safe-area-inset-bottom))] text-brand-neutral-100 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-8 sm:pb-8">
          <p>© {year} xmcp. All rights reserved.</p>
          <a
            href="https://vercel.com/oss"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClassName}
          >
            <Icons.vercel aria-hidden="true" className="size-3.5 shrink-0" />
            <span className="link-underline-label">
              Vercel Open Source Program
            </span>
            <ArrowUpRight aria-hidden="true" className="size-3 shrink-0" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </div>
    </footer>
  );
};
