import Link from "next/link";
import { MobileMenu } from "./mobile";
import { AskAIButton } from "@/components/ai/ask";
import { SearchToggle } from "../docs";
import { AnimatedLink } from "@/components/animated-link";
import { LogoContextMenu } from "./logo-menu";
import { ProgressiveBlurBackground } from "./progressive-blur-bg";

export const Header = () => {
  return (
    <header className="sticky top-0 right-0 left-0 w-full mx-auto bg-transparent z-[100] flex justify-center items-center">
      <div
        className={
          "w-full flex justify-center items-center z-[100] px-4 py-2 gap-8 relative"
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

// TODO: bigger svg to download, maybe
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
        fillRule="evenodd"
        clipRule="evenodd"
        d="M52.5 18.1313V18.9556H58.5116V18.1313H56.794V14.2731H57.6526V15.1333H59.3703V15.9934H60.229V15.1333H61.9469V14.2731H62.8055V7.39184H61.9469V5.67147H61.0877V4.81129H59.3703V3.95117H57.6526V4.81129H55.9353V5.67147H55.0763V6.53165H52.5V7.39184H53.3587V18.1313H52.5ZM57.6526 14.2731V13.4129H56.794V5.67147H57.6526V6.53165H58.5116V7.39184H59.3703V14.2731H57.6526Z"
        fill="#F7F7F7"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M46.3668 16.9969H47.3703V15.9934H48.3739V14.9899H50.3809V15.9934H49.3775V16.9969H48.3739V18.0005H47.3703V19.004H44.3598V18.0005H42.3526V16.9969H41.3493V9.97232H40.3457V8.96879H41.3493V7.96527H42.3526V6.96175H43.3562V5.95822H45.3634V4.9547H47.3703V3.95117H48.3739V4.9547H49.3775V5.95822H50.3809V6.96175H51.3845V7.96527H50.3809V10.9758H49.3775V9.97232H48.3739V8.96879H47.3703V7.96527H46.3668V6.96175H45.3634V15.9934H46.3668V16.9969ZM50.3809 14.9899V13.9864H51.3845V14.9899H50.3809Z"
        fill="#F7F7F7"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M36.0598 3.95117V4.9547H35.0562V5.95822H34.0529V6.96175H32.0457V5.95822H31.0423V4.9547H30.0388V3.95117H29.0352V4.9547H28.0316V5.95822H27.0282V6.96175H25.021V5.95822H24.0175V4.9547H23.0141V3.95117H22.0105V4.9547H21.0069V5.95822H19V6.96175H21.0069V16.9969H20.0033V18.0005H22.0105V19.004H24.0175V18.0005H26.0246V16.9969H25.021V7.96527H27.0282V6.96175H28.0316V16.9969H27.0282V18.0005H29.0352V19.004H31.0423V18.0005H33.0493V16.9969H32.0457V7.96527H34.0529V6.96175H35.0562V16.9969H34.0529V18.0005H36.0598V19.004H38.067V18.0005H40.0739V16.9969H39.0703V7.96527H40.0739V6.96175H39.0703V5.95822H38.067V4.9547H37.0634V3.95117H36.0598Z"
        fill="#F7F7F7"
      />
      <path
        d="M0 5H1.00213V6H0V5ZM1.00213 22V19H2.00426V18H3.0064V17H5.01066V16H6.01279V15H7.01492V17H9.01919V18H10.0213V19H11.0235V20H10.0213V21H9.01919V22H8.01706V21H7.01492V20H5.01066V21H4.00853V23H5.01066V24H3.0064V23H2.00426V22H1.00213ZM1.00213 5V3H2.00426V2H3.0064V1H7.01492V2H9.01919V3H10.0213V5H11.0235V6H12.0256V7H13.0277V8H12.0256V9H17.0362V10H16.0341V11H14.0298V13H15.032V14H16.0341V15H17.0362V17H18.0384V18H19.0405V19H17.0362V20H16.0341V21H15.032V20H14.0298V18H13.0277V16H12.0256V15H11.0235V13H9.01919V12H2.00426V11H3.0064V10H4.00853V9H8.01706V8H7.01492V6H6.01279V4H5.01066V3H4.00853V4H2.00426V5H1.00213ZM7.01492 15V14H8.01706V15H7.01492ZM8.01706 14V13H9.01919V14H8.01706ZM11.0235 19V18H12.0256V19H11.0235ZM11.0235 5V4H12.0256V5H11.0235ZM12.0256 4V3H13.0277V1H15.032V2H17.0362V1H19.0405V4H18.0384V5H16.0341V6H15.032V5H14.0298V7H13.0277V4H12.0256ZM19.0405 18V17H20.0426V18H19.0405ZM19.0405 1V0H20.0426V1H19.0405Z"
        fill="#F7F7F7"
      />
    </svg>
  );
};
