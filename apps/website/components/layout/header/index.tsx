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
      <div className="w-full flex justify-between items-center z-100 px-4 py-4 md:py-8 gap-8 relative">
        <div className="flex gap-8 items-center">
          <Link
            href="/"
            className="hover:opacity-80 transition-opacity"
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
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-4 items-center z-[7]">
          <SearchToggle />
          <AskAIButton />
        </div>
        <div className="flex gap-4 items-center">
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
      width="87"
      height="32"
      viewBox="0 0 87 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M70.002 24.1749V25.274H78.0174V24.1749H75.7272V19.0306H76.8722V20.1776H79.1623V21.3244H80.3073V20.1776H82.5978V19.0306H83.7427V9.85562H82.5978V7.5618H81.4522V6.41489H79.1623V5.26807H76.8722V6.41489H74.5823V7.5618H73.4371V8.70871H70.002V9.85562H71.1469V24.1749H70.002ZM76.8722 19.0306V17.8837H75.7272V7.5618H76.8722V8.70871H78.0174V9.85562H79.1623V19.0306H76.8722Z"
        fill="#F7F7F7"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M61.823 22.6624H63.1611V21.3244H64.4993V19.9863H67.1752V21.3244H65.8374V22.6624H64.4993V24.0004H63.1611V25.3385H59.1471V24.0004H56.4708V22.6624H55.133V13.2963H53.7949V11.9582H55.133V10.6202H56.4708V9.28216H57.809V7.94413H60.4852V6.6061H63.1611V5.26807H64.4993V6.6061H65.8374V7.94413H67.1752V9.28216H68.5133V10.6202H67.1752V14.6343H65.8374V13.2963H64.4993V11.9582H63.1611V10.6202H61.823V9.28216H60.4852V21.3244H61.823V22.6624ZM67.1752 19.9863V18.6483H68.5133V19.9863H67.1752Z"
        fill="#F7F7F7"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M48.0785 5.26822V6.60625H46.7404V7.94428H45.4026V9.28232H42.7263V7.94428H41.3885V6.60625H40.0504V5.26822H38.7123V6.60625H37.3742V7.94428H36.0364V9.28232H33.3601V7.94428H32.022V6.60625H30.6842V5.26822H29.3461V6.60625H28.0079V7.94428H25.332V9.28232H28.0079V22.6626H26.6698V24.0006H29.3461V25.3386H32.022V24.0006H34.6982V22.6626H33.3601V10.6204H36.0364V9.28232H37.3742V22.6626H36.0364V24.0006H38.7123V25.3386H41.3885V24.0006H44.0644V22.6626H42.7263V10.6204H45.4026V9.28232H46.7404V22.6626H45.4026V24.0006H48.0785V25.3386H50.7547V24.0006H53.4307V22.6626H52.0925V10.6204H53.4307V9.28232H52.0925V7.94428H50.7547V6.60625H49.4166V5.26822H48.0785Z"
        fill="#F7F7F7"
      />
      <path
        d="M0 6.66667H1.33618V8H0V6.66667ZM1.33618 29.3333V25.3333H2.67236V24H4.00854V22.6667H6.68089V21.3333H8.01707V20H9.35325V22.6667H12.0256V24H13.3618V25.3333H14.698V26.6667H13.3618V28H12.0256V29.3333H10.6894V28H9.35325V26.6667H6.68089V28H5.34472V30.6667H6.68089V32H4.00854V30.6667H2.67236V29.3333H1.33618ZM1.33618 6.66667V4H2.67236V2.66667H4.00854V1.33333H9.35325V2.66667H12.0256V4H13.3618V6.66667H14.698V8H16.0341V9.33333H17.3703V10.6667H16.0341V12H22.715V13.3333H21.3789V14.6667H18.7065V17.3333H20.0427V18.6667H21.3789V20H22.715V22.6667H24.0512V24H25.3874V25.3333H22.715V26.6667H21.3789V28H20.0427V26.6667H18.7065V24H17.3703V21.3333H16.0341V20H14.698V17.3333H12.0256V16H2.67236V14.6667H4.00854V13.3333H5.34472V12H10.6894V10.6667H9.35325V8H8.01707V5.33333H6.68089V4H5.34472V5.33333H2.67236V6.66667H1.33618ZM9.35325 20V18.6667H10.6894V20H9.35325ZM10.6894 18.6667V17.3333H12.0256V18.6667H10.6894ZM14.698 25.3333V24H16.0341V25.3333H14.698ZM14.698 6.66667V5.33333H16.0341V6.66667H14.698ZM16.0341 5.33333V4H17.3703V1.33333H20.0427V2.66667H22.715V1.33333H25.3874V5.33333H24.0512V6.66667H21.3789V8H20.0427V6.66667H18.7065V9.33333H17.3703V5.33333H16.0341ZM25.3874 24V22.6667H26.7236V24H25.3874ZM25.3874 1.33333V0H26.7236V1.33333H25.3874Z"
        fill="#F7F7F7"
      />
    </svg>
  );
};

const GithubButton = () => {
  return (
    <Link
      href="https://github.com/basementstudio/xmcp"
      className="text-white hover:text-white/80 transition-colors hidden md:flex items-center gap-2"
      target="_blank"
      aria-label="GitHub"
    >
      900
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
