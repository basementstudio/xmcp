import Link from "next/link";
import HeroBg from "@public/hero-bg.png";
import Image from "next/image";
import { Button } from "../ui/button";
import { Icons } from "../icons";
import { Logos } from "./logos";
import { Tag } from "../ui/tag";

export const HomeHero = () => {
  return (
    <div className="flex flex-col items-center justify-center max-w-[720px] w-full mx-auto py-8 md:py-16 gap-4 col-span-12">
      <Link
        className="flex items-center justify-center gap-2 z-10 text-xs group"
        href="https://npmjs.com/package/xmcp"
      >
        v0.3.2
        <Tag
          text="Latest Version"
          className="group-hover:border-brand-white group-hover:text-brand-white transition-colors duration-200"
        />
      </Link>
      <h1 className="display text-center text-balance z-10 text-gradient">
        The TypeScript framework for building & shipping MCP servers
      </h1>
      <Image
        src={HeroBg}
        alt="A person, presumably a techno-optimist, shipping an MCP server with xmcp"
        className="mix-blend-hard-light max-h-[420px] h-auto w-auto rotate-y-[3.142rad]"
      />
      <div className="flex items-center justify-center gap-2">
        <Button variant="primary" asChild>
          <Link href="/docs">Get started</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link
            href="https://vercel.com/new/clone?demo-description=The%20TypeScript%20MCP%20framework&demo-image=%2F%2Fimages.ctfassets.net%2Fe5382hct74si%2FasHTCFA47swQRiCYbWJDl%2F85fc42d9ef2dae4312744a964251f223%2Fimage__7_.png&demo-title=xmcp%20boilerplate&demo-url=https%3A%2F%2Fxmcp-template.vercel.app%2F&from=templates&project-name=xmcp%20boilerplate&project-names=Comma%20separated%20list%20of%20project%20names%2Cto%20match%20the%20root-directories&repository-name=xmcp-boilerplate&repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fexamples%2Ftree%2Fmain%2Fframework-boilerplates%2Fxmcp&root-directories=List%20of%20directory%20paths%20for%20the%20directories%20to%20clone%20into%20projects&skippable-integrations=1"
            target="_blank"
          >
            Deploy to <Icons.vercel className="size-3 ml-1" />
          </Link>
        </Button>
      </div>
      <div className="flex flex-col items-center justify-center gap-4.5 py-8">
        <p className="text-brand-neutral-200 text-sm">Trusted by builders at</p>
        <div className="flex items-center justify-center gap-4 md:gap-10 flex-wrap">
          <Logos.Vercel className="max-w-22 h-auto" />
          <Logos.Localstack className="mt-0.5" />
          <Logos.Basehub />
        </div>
      </div>
    </div>
  );
};
