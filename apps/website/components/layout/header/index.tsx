import Link from "next/link";
import { XmcpLogo } from "@/components/xmcp-logo";
import { MobileMenu } from "./mobile";
import { AskAIButton } from "@/components/ai/ask";
import { SearchToggle } from "../search-toggle";
import { AnimatedLink } from "@/components/animated-link";
import { LogoContextMenu } from "./logo-menu";
import { ProgressiveBlurBackground } from "./progressive-blur-bg";

export const Header = () => {
  return (
    <header className="sticky top-0 right-0 left-0 w-full mx-auto bg-transparent z-100 flex justify-center items-center">
      <div
        className={
          "w-full flex justify-center items-center z-100 px-4 py-2 gap-8 relative"
        }
      >
        <nav
          aria-label="Main"
          className="relative flex justify-center items-center text-sm text-brand-white gap-8"
        >
          <div className="hidden xl:flex gap-4">
            <AnimatedLink href="/">Home</AnimatedLink>
            <AnimatedLink href="/docs">Docs</AnimatedLink>
            <AnimatedLink href="/templates">Templates</AnimatedLink>
            <AnimatedLink href="/blog">Blog</AnimatedLink>
            <AnimatedLink href="/changelog">Changelog</AnimatedLink>
            <AnimatedLink href="/showcase">Showcase</AnimatedLink>
            <AnimatedLink href="/faq">FAQ</AnimatedLink>
          </div>
        </nav>
        <div className="flex gap-2 ml-auto items-center">
          <SearchToggle />
          <AskAIButton />
          <GithubButton />
          <MobileMenu />
        </div>
        <Link
          href="/"
          prefetch={false}
          className="absolute xl:left-1/2 xl:top-1/2 xl:-translate-x-1/2 xl:-translate-y-1/2 left-4 top-1/2 -translate-y-1/2"
          aria-label="Home"
        >
          <LogoContextMenu>
            <XmcpLogo className="hover:opacity-80 transition-opacity cursor-pointer" />
          </LogoContextMenu>
        </Link>
      </div>
      <ProgressiveBlurBackground />
    </header>
  );
};

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
