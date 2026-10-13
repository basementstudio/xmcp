import Link from "next/link";
import { XmcpLogo } from "@/components/xmcp-logo";
import { DiscordLogoIcon, GitHubLogoIcon } from "@/components/ui/site-icons";
import {
  ArrowTopRightIcon as ArrowUpRight,
  DotFilledIcon as CircleDot,
} from "@/components/ui/site-icons";
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
      { label: "FAQ", href: "/faq" },
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

const linkClassName = "site-footer-link";

export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-main">
          <div className="site-footer-brand">
            <Link
              href="/"
              prefetch={false}
              aria-label="xmcp home"
              className="site-footer-home"
            >
              <XmcpLogo className="h-7 w-auto" />
            </Link>
            <p>
              The TypeScript MCP framework.
              <span>Tools, prompts, and resources for AI applications.</span>
            </p>
          </div>
          <div className="site-footer-groups">
            {linkGroups.map(({ title, id, links }) => (
              <nav key={id} aria-labelledby={id} className="min-w-0">
                <h2 id={id} className="site-footer-label">
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
                          <span className="site-footer-link-label">
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
        <div className="site-footer-bottom">
          <p>© {year} xmcp</p>
          <a
            href="https://vercel.com/oss"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClassName}
          >
            <Icons.vercel aria-hidden="true" className="size-3.5 shrink-0" />
            <span className="site-footer-link-label">Supported by Vercel</span>
            <ArrowUpRight aria-hidden="true" className="size-3 shrink-0" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </div>
    </footer>
  );
};
