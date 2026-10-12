import Link from "next/link";
import { XmcpLogo } from "@/components/xmcp-logo";
import { MobileMenu } from "./mobile";
import { AskAIButton } from "@/components/ai/ask";
import { SearchToggle } from "../search-toggle";
import { AnimatedLink } from "@/components/animated-link";
import { LogoContextMenu } from "./logo-menu";
import { source } from "@/lib/source";
import { DocumentationNavigation } from "../docs";
import { ThemeToggle } from "fumadocs-ui/components/layout/theme-toggle";

export const Header = () => (
  <header className="site-header sticky top-0 z-100 w-full">
    <div className="site-header-inner mx-auto flex h-[72px] max-w-[1440px] items-center gap-6 px-4 md:px-8">
      <Link
        href="/"
        prefetch={false}
        aria-label="xmcp home"
        className="shrink-0 text-brand-white"
      >
        <LogoContextMenu>
          <XmcpLogo className="h-7 w-auto" />
        </LogoContextMenu>
      </Link>
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
        <ThemeToggle
          mode="light-dark"
          aria-label="Switch between light and dark theme"
        />
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
      className="text-brand-white hover:text-brand-white/80 transition-colors hidden xl:block"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="GitHub"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12.002 2C6.47695 2 2.00195 6.475 2.00195 12C2.00195 16.425 4.86445 20.1625 8.83945 21.4875C9.33945 21.575 9.52695 21.275 9.52695 21.0125C9.52695 20.775 9.51445 19.9875 9.51445 19.15C7.00195 19.6125 6.35195 18.5375 6.15195 17.975C6.03945 17.6875 5.55195 16.8 5.12695 16.5625C4.77695 16.375 4.27695 15.9125 5.11445 15.9C5.90195 15.8875 6.46445 16.625 6.65195 16.925C7.55195 18.4375 8.98945 18.0125 9.56445 17.75C9.65195 17.1 9.91445 16.6625 10.202 16.4125C7.97695 16.1625 5.65195 15.3 5.65195 11.475C5.65195 10.3875 6.03945 9.4875 6.67695 8.7875C6.57695 8.5375 6.22695 7.5125 6.77695 6.1375C6.77695 6.1375 7.61445 5.875 9.52695 7.1625C10.327 6.9375 11.177 6.825 12.027 6.825C12.877 6.825 13.727 6.9375 14.527 7.1625C16.4395 5.8625 17.277 6.1375 17.277 6.1375C17.827 7.5125 17.477 8.5375 17.377 8.7875C18.0145 9.4875 18.402 10.375 18.402 11.475C18.402 15.3125 16.0645 16.1625 13.8395 16.4125C14.202 16.725 14.5145 17.325 14.5145 18.2625C14.5145 19.6 14.502 20.675 14.502 21.0125C14.502 21.275 14.6895 21.5875 15.1895 21.4875C19.26 20.1133 22.0009 16.2963 22.002 12C22.002 6.475 17.527 2 12.002 2Z"
          fill="currentColor"
        />
      </svg>
    </Link>
  );
};
