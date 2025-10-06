import { AnimatedLink } from "@/components/animated-link";
import styles from "./progressive-blur.module.css";
import Link from "next/link";
import { MobileMenu } from "./mobile";
import { AskAIButton } from "@/components/ai/ask";
import { SearchToggle } from "../docs";

export const Header = () => {
  return (
    <header className="sticky top-0 right-0 left-0 w-full mx-auto bg-transparent z-100 flex justify-center items-center">
      <div
        className={`
          pointer-events-none
          absolute inset-0
          w-full h-full
          ${styles.progressiveBlur}
        `}
        aria-hidden="true"
      >
        <div></div>
        <div></div>
        <div></div>
      </div>
      <div className="w-full flex justify-center items-center z-100 px-4 py-4 md:py-8 gap-8 max-w-[1440px]">
        <Link
          href="/"
          className="size-6 md:size-8 hover:opacity-80 transition-opacity"
          aria-label="Home"
        >
          <div className="w-full h-full">
            <Logo />
          </div>
        </Link>
        <div className="z-[6] relative flex justify-start items-center text-center text-md text-white font-mono gap-8">
          <div className="hidden md:flex gap-8">
            <AnimatedLink href="/docs">Docs</AnimatedLink>
            <AnimatedLink href="/examples">Examples</AnimatedLink>
            <AnimatedLink href="/showcase">Showcase</AnimatedLink>
            <AnimatedLink href="/blog">Blog</AnimatedLink>
          </div>
        </div>
        <div className="flex gap-4 ml-auto items-center">
          <SearchToggle />
          <AskAIButton />
          <GithubButton />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
};

const Logo = () => {
  return (
    <svg
      width="27"
      height="32"
      viewBox="0 0 27 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="size-full"
    >
      <path
        d="M0 6.66667H1.35V8H0V6.66667ZM1.35 29.3333V25.3333H2.7V24H4.05V22.6667H6.75V21.3333H8.1V20H9.45V22.6667H12.15V24H13.5V25.3333H14.85V26.6667H13.5V28H12.15V29.3333H10.8V28H9.45V26.6667H6.75V28H5.4V30.6667H6.75V32H4.05V30.6667H2.7V29.3333H1.35ZM1.35 6.66667V4H2.7V2.66667H4.05V1.33333H9.45V2.66667H12.15V4H13.5V6.66667H14.85V8H16.2V9.33333H17.55V10.6667H16.2V12H22.95V13.3333H21.6V14.6667H18.9V17.3333H20.25V18.6667H21.6V20H22.95V22.6667H24.3V24H25.65V25.3333H22.95V26.6667H21.6V28H20.25V26.6667H18.9V24H17.55V21.3333H16.2V20H14.85V17.3333H12.15V16H2.7V14.6667H4.05V13.3333H5.4V12H10.8V10.6667H9.45V8H8.1V5.33333H6.75V4H5.4V5.33333H2.7V6.66667H1.35ZM9.45 20V18.6667H10.8V20H9.45ZM10.8 18.6667V17.3333H12.15V18.6667H10.8ZM14.85 25.3333V24H16.2V25.3333H14.85ZM14.85 6.66667V5.33333H16.2V6.66667H14.85ZM16.2 5.33333V4H17.55V1.33333H20.25V2.66667H22.95V1.33333H25.65V5.33333H24.3V6.66667H21.6V8H20.25V6.66667H18.9V9.33333H17.55V5.33333H16.2ZM25.65 24V22.6667H27V24H25.65ZM25.65 1.33333V0H27V1.33333H25.65Z"
        fill="white"
      />
    </svg>
  );
};

const GithubButton = () => {
  return (
    <Link
      href="https://github.com/basementstudio/xmcp"
      className="text-white hover:text-white/80 transition-colors hidden md:block"
      target="_blank"
      aria-label="GitHub"
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="size-5"
      >
        <path
          d="M7.49933 0.25C3.49635 0.25 0.25 3.49593 0.25 7.50024C0.25 10.703 2.32715 13.4206 5.2081 14.3797C5.57084 14.446 5.70302 14.2222 5.70302 14.0299C5.70302 13.8576 5.69679 13.4019 5.69323 12.797C3.67661 13.235 3.25112 11.825 3.25112 11.825C2.92132 10.9874 2.44599 10.7644 2.44599 10.7644C1.78773 10.3149 2.49584 10.3238 2.49584 10.3238C3.22353 10.375 3.60629 11.0711 3.60629 11.0711C4.25298 12.1788 5.30335 11.8588 5.71638 11.6732C5.78225 11.205 5.96962 10.8854 6.17658 10.7043C4.56675 10.5209 2.87415 9.89918 2.87415 7.12104C2.87415 6.32925 3.15677 5.68257 3.62053 5.17563C3.54576 4.99226 3.29697 4.25521 3.69174 3.25691C3.69174 3.25691 4.30015 3.06196 5.68522 3.99973C6.26337 3.83906 6.8838 3.75895 7.50022 3.75583C8.1162 3.75895 8.73619 3.83906 9.31523 3.99973C10.6994 3.06196 11.3069 3.25691 11.3069 3.25691C11.7026 4.25521 11.4538 4.99226 11.3795 5.17563C11.8441 5.68257 12.1245 6.32925 12.1245 7.12104C12.1245 9.9063 10.4292 10.5192 8.81452 10.6985C9.07444 10.9224 9.30633 11.3648 9.30633 12.0413C9.30633 13.0102 9.29742 13.7922 9.29742 14.0299C9.29742 14.2239 9.42828 14.4496 9.79591 14.3788C12.6746 13.4179 14.75 10.7025 14.75 7.50024C14.75 3.49593 11.5036 0.25 7.49933 0.25Z"
          fill="currentColor"
          fillRule="evenodd"
          clipRule="evenodd"
        ></path>
      </svg>
    </Link>
  );
};
