"use client";

import Link from "next/link";
import { Button } from "../../ui/button";
import { Icons } from "../../icons";
import { Logos } from "../logos";
import Shader from "../shader";
import { AnimatedHeading } from "../../ui/animated-heading";
import { useFadeIn } from "@/lib/anim/use-fade-in";
import { useRef } from "react";
import { Tag } from "@/components/ui/tag";

export const HomeHero = ({ version }: { version: string }) => {
  const tagRef = useRef<HTMLAnchorElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const logosRef = useRef<HTMLDivElement>(null);

  useFadeIn({
    refs: [tagRef],
    delay: 0.2,
    yOffset: 0,
  });

  useFadeIn({
    refs: [buttonsRef, logosRef],
    start: "top 90%",
    duration: 0.6,
    stagger: 0.2,
    yOffset: 16,
  });

  return (
    <div className="flex flex-col items-center justify-center max-w-[720px] w-full mx-auto py-8 md:py-16 gap-4 col-span-12">
      <Link
        ref={tagRef}
        className="flex items-center justify-center gap-2 z-10 text-xs group invisible"
        href="https://npmjs.com/package/xmcp"
        target="_blank"
      >
        {version ? `v${version}` : ""}
        <Tag
          animate
          text="Latest Version"
          className="group-hover:border-brand-neutral-200 group-hover:text-brand-neutral-50 transition-colors duration-200"
        />
      </Link>
      <AnimatedHeading
        className="display text-center text-balance z-10"
        masked
        effectDuration={4}
      >
        The TypeScript framework for building & shipping MCP servers
      </AnimatedHeading>
      <Shader />
      <div className="flex items-center justify-center gap-2" ref={buttonsRef}>
        <Button
          variant="primary"
          asChild
          trackIntent="get started"
          trackLocation="home hero"
        >
          <Link href="/docs">Get started</Link>
        </Button>
        <Button
          variant="secondary"
          asChild
          trackIntent="deploy to vercel"
          trackLocation="home hero"
        >
          <Link
            href="https://vercel.com/new/clone?demo-description=The%20TypeScript%20MCP%20framework&demo-image=%2F%2Fimages.ctfassets.net%2Fe5382hct74si%2FasHTCFA47swQRiCYbWJDl%2F85fc42d9ef2dae4312744a964251f223%2Fimage__7_.png&demo-title=xmcp%20boilerplate&demo-url=https%3A%2F%2Fxmcp-template.vercel.app%2F&from=templates&project-name=xmcp%20boilerplate&project-names=Comma%20separated%20list%20of%20project%20names%2Cto%20match%20the%20root-directories&repository-name=xmcp-boilerplate&repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fexamples%2Ftree%2Fmain%2Fframework-boilerplates%2Fxmcp&root-directories=List%20of%20directory%20paths%20for%20the%20directories%20to%20clone%20into%20projects&skippable-integrations=1"
            target="_blank"
          >
            Deploy to <Icons.vercel className="size-3 ml-1" />
          </Link>
        </Button>
      </div>
      <div
        className="flex flex-col items-center justify-center gap-4.5 py-8 invisible"
        ref={logosRef}
      >
        <p className="text-brand-neutral-200 text-sm">Trusted by builders at</p>
        <div className="flex items-center justify-center gap-4 md:gap-6 flex-wrap w-xl">
          <Logos.Vercel className="max-h-5 w-auto" />
          <Logos.Nextjs className="max-h-4 w-auto" />
          <Logos.Localstack className="max-h-6 w-auto" />
          <Logos.Basehub className="max-h-6 w-auto" />
        </div>
      </div>
    </div>
  );
};
