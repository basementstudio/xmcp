import { GitHubLogoIcon } from "@/components/ui/site-icons";
import Link from "next/link";
import { XmcpLogo } from "@/components/xmcp-logo";
import { MobileMenu } from "./mobile";
import { AskAIButton } from "@/components/ai/ask";
import { SearchToggle } from "../search-toggle";
import { AnimatedLink } from "@/components/animated-link";
import { LogoContextMenu } from "./logo-menu";
import { source } from "@/lib/source";
import { DocumentationNavigation } from "../docs";
import { ThemeToggle } from "../theme-toggle";

export const Header = () => (
  <header className="site-header sticky top-0 z-100 w-full">
    <div className="site-header-inner mx-auto flex h-[72px] max-w-[1440px] items-center gap-6 px-4 md:px-8">
      <LogoContextMenu>
        <Link
          href="/"
          prefetch={false}
          aria-label="xmcp home"
          className="block text-brand-white"
        >
          <XmcpLogo className="h-7 w-auto" />
        </Link>
      </LogoContextMenu>
      <span className="site-brand-caption hidden 2xl:block border-l border-brand-neutral-500 pl-5 font-mono text-[10px] uppercase tracking-[.12em] text-brand-neutral-100">
        The MCP framework
      </span>
      <div className="site-navigation-scroll">
        <nav
          aria-label="Main"
          className="site-navigation hidden xl:flex items-center gap-5 ml-auto text-[13px]"
        >
          <AnimatedLink href="/">Overview</AnimatedLink>
          <DocumentationNavigation tree={source.pageTree} />
          <AnimatedLink href="/templates">Templates</AnimatedLink>
          <AnimatedLink href="/showcase">Showcase</AnimatedLink>
          <AnimatedLink href="/guides">Guides</AnimatedLink>
          <AnimatedLink href="/blog">Blog</AnimatedLink>
          <AnimatedLink href="/changelog">Changelog</AnimatedLink>
          <AnimatedLink href="/faq">FAQ</AnimatedLink>
        </nav>
      </div>
      <div className="site-controls ml-auto xl:ml-0 flex items-center gap-2 md:gap-3">
        <SearchToggle
          aria-label="Search documentation"
          className="min-h-11 min-w-11"
        />
        <div className="site-ask hidden sm:block">
          <AskAIButton />
        </div>
        <ThemeToggle />
        <GithubButton />
        <MobileMenu />
      </div>
    </div>
  </header>
);

const GithubButton = () => {
  return (
    <Link
      href="https://github.com/basementstudio/xmcp"
      className="site-github-link text-brand-white hover:text-brand-white/80 transition-colors hidden xl:block"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="GitHub"
    >
      <GitHubLogoIcon className="mx-auto" />
    </Link>
  );
};
