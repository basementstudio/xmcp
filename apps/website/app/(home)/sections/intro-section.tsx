import { AnimatedLink } from "@/components/animated-link";
import { XmcpLogo } from "@/components/terminal/logo";
import { Terminal } from "@/components/terminal/terminal";

export function IntroSection() {
  return (
    <div className="h-full flex flex-col items-stretch justify-start lg:justify-center">
      <div className="space-y-6 pb-24">
        <div className="relative w-[150px] md:w-[200px] lg:w-[220px] aspect-square flex items-center justify-center mx-auto">
          <XmcpLogo />
        </div>
        <h1 className="max-w-[30rem] mx-auto text-2xl">
          The framework for building & shipping MCP servers
        </h1>
        <p className="text-balance text-[#BABABA] text-[1rem]">
          Designed with DX in mind, it streamlines development and lowers the
          barrier to entry for anyone looking to create and deploy powerful
          tools on top of the Model Context Protocol ecosystem.
        </p>
        <div className="space-y-4 text-left mt-12">
          <Terminal>npx create-xmcp-app</Terminal>
          <span className="text-sm">
            <i>Bootstrap your xmcp app with one command</i>
          </span>
          <Terminal initialDelay={1500} className="mt-12">
            npx init-xmcp
          </Terminal>
          <span className="text-sm">
            <i>
              Plug into your existing{" "}
              <AnimatedLink
                href="https://nextjs.org"
                target="_blank"
                className="text-white normal-case"
              >
                Next.js
              </AnimatedLink>{" "}
              or{" "}
              <AnimatedLink
                href="https://expressjs.com"
                target="_blank"
                className="text-white normal-case"
              >
                Express
              </AnimatedLink>{" "}
              app
            </i>
          </span>
        </div>
      </div>
    </div>
  );
}
