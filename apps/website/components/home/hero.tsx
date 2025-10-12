import Link from "next/link";
import HeroBg from "@public/hero-bg.png";
import Image from "next/image";
import { Button } from "../ui/button";
import { Icons } from "../icons";
import { Logos } from "./logos";

export const HomeHero = () => {
  return (
    <div className="flex flex-col items-center justify-center max-w-[720px] w-full mx-auto py-8 md:py-16 gap-4">
      <Link
        className="flex items-center justify-center gap-2 z-10 text-xs"
        href="https://npmjs.com/package/xmcp"
      >
        v0.3.2
        <Tag text="Latest Version" />
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
        <Button variant="primary">Get started</Button>
        <Button variant="secondary">
          Deploy to <Icons.vercel className="size-3 ml-1" />
        </Button>
      </div>
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <p className="text-brand-neutral-200 text-sm">Trusted by builders at</p>
        <div className="flex items-center justify-center gap-4 md:gap-10 flex-wrap">
          <Logos.Vercel />
          <Logos.Localstack />
          <Logos.Basehub />
        </div>
      </div>
    </div>
  );
};

const Tag = ({ text }: { text: string }) => {
  return (
    <div className="py-1 px-2 bg-brand-neutral-600 text-[0.625rem] md:text-xs uppercase border border-dashed border-brand-neutral-400 text-brand-neutral-100">
      {text}
    </div>
  );
};
