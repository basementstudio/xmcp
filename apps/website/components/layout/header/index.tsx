import Link from "next/link";
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
        <div className="relative flex justify-center items-center text-sm text-brand-white gap-8">
          <div className="hidden md:flex gap-4">
            <AnimatedLink href="/">Home</AnimatedLink>
            <AnimatedLink href="/docs">Docs</AnimatedLink>
            <AnimatedLink href="/examples">Examples</AnimatedLink>
            <AnimatedLink href="/blog">Blog</AnimatedLink>
            <AnimatedLink href="/showcase">Showcase</AnimatedLink>
          </div>
        </div>
        <div className="flex gap-2 ml-auto items-center">
          <SearchToggle />
          <AskAIButton />
          <GithubButton />
          <MobileMenu />
        </div>
        <Link
          href="/"
          className="absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 left-4 top-1/2 -translate-y-1/2"
          aria-label="Home"
        >
          <LogoContextMenu>
            <Logo className="hover:opacity-80 transition-opacity cursor-pointer" />
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
      className="text-brand-white hover:text-brand-white/80 transition-colors hidden md:block"
      target="_blank"
      aria-label="GitHub"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
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

const Logo = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="63"
      height="24"
      viewBox="0 0 63 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M52.5 18.1313v.8243h6.0116v-.8243H56.794v-3.8582h.8586v.8602h1.7177v.8601h.8587v-.8601h1.7179v-.8602h.8586V7.39184h-.8586V5.67147h-.8592v-.86018h-1.7174v-.86012h-1.7177v.86012h-1.7173v.86018h-.859v.86018H52.5v.86019h.8587V18.1313zm5.1526-3.8582v-.8602h-.8586V5.67147h.8586v.86018h.859v.86019h.8587v6.88126zM46.3668 16.9969h1.0035v-1.0035h1.0036v-1.0035h2.007v1.0035h-1.0034v1.0035h-1.0036v1.0036h-1.0036v1.0035h-3.0105v-1.0035h-2.0072v-1.0036h-1.0033V9.97232h-1.0036V8.96879h1.0036V7.96527h1.0033V6.96175h1.0036V5.95822h2.0072V4.9547h2.0069V3.95117h1.0036V4.9547h1.0036v1.00352h1.0034v1.00353h1.0036v1.00352h-1.0036v3.01053h-1.0034V9.97232h-1.0036V8.96879h-1.0036V7.96527h-1.0035V6.96175h-1.0034v9.03165h1.0034zm4.0141-2.007v-1.0035h1.0036v1.0035zM36.0598 3.95117V4.9547h-1.0036v1.00352h-1.0033v1.00353h-2.0072V5.95822h-1.0034V4.9547h-1.0035V3.95117h-1.0036V4.9547h-1.0036v1.00352h-1.0034v1.00353H25.021V5.95822h-1.0035V4.9547h-1.0034V3.95117h-1.0036V4.9547h-1.0036v1.00352H19v1.00353h2.0069V16.9969h-1.0036v1.0036h2.0072v1.0035h2.007v-1.0035h2.0071v-1.0036H25.021V7.96527h2.0072V6.96175h1.0034V16.9969h-1.0034v1.0036h2.007v1.0035h2.0071v-1.0035h2.007v-1.0036h-1.0036V7.96527h2.0072V6.96175h1.0033V16.9969h-1.0033v1.0036h2.0069v1.0035h2.0072v-1.0035h2.0069v-1.0036h-1.0036V7.96527h1.0036V6.96175h-1.0036V5.95822H38.067V4.9547h-1.0036V3.95117z"
        fill="#f7f7f7"
      />
      <path
        d="M0 5h1.00213v1H0zm1.00213 17v-3h1.00213v-1H3.0064v-1h2.00426v-1h1.00213v-1h1.00213v2h2.00427v1h1.00211v1h1.0022v1h-1.0022v1H9.01919v1H8.01706v-1H7.01492v-1H5.01066v1H4.00853v2h1.00213v1H3.0064v-1H2.00426v-1zm0-17V3h1.00213V2H3.0064V1h4.00852v1h2.00427v1h1.00211v2h1.0022v1h1.0021v1h1.0021v1h-1.0021v1h5.0106v1h-1.0021v1h-2.0043v2h1.0022v1h1.0021v1h1.0021v2h1.0022v1h1.0021v1h-2.0043v1h-1.0021v1H15.032v-1h-1.0022v-2h-1.0021v-2h-1.0021v-1h-1.0021v-2H9.01919v-1H2.00426v-1H3.0064v-1h1.00213V9h4.00853V8H7.01492V6H6.01279V4H5.01066V3H4.00853v1H2.00426v1zm6.01279 10v-1h1.00214v1zm1.00214-1v-1h1.00213v1zm3.00644 5v-1h1.0021v1zm0-14V4h1.0021v1zm1.0021-1V3h1.0021V1h2.0043v1h2.0042V1h2.0043v3h-1.0021v1h-2.0043v1H15.032V5h-1.0022v2h-1.0021V4zm7.0149 14v-1h1.0021v1zm0-17V0h1.0021v1z"
        fill="#f7f7f7"
      />
    </svg>
  );
};
