"use client";

import Link from "next/link";
import { Button } from "../../ui/button";
import { Icons } from "../../icons";
import { Logos } from "../logos";
import Shader from "../shader";
import { AnimatedHeading } from "../../ui/animated-heading";
import { VersionTag } from "./version-tag";
import { useFadeIn } from "@/lib/anim/use-fade-in";
import { useRef } from "react";

export const HomeHero = ({ version }: { version: string }) => {
  const buttonsRef = useRef<HTMLDivElement>(null);
  const logosRef = useRef<HTMLDivElement>(null);

  useFadeIn({
    refs: [buttonsRef, logosRef],
    start: "top 90%",
    duration: 0.6,
    stagger: 0.2,
    yOffset: 16,
  });

  return (
    <div className="flex flex-col items-center justify-center max-w-[720px] w-full mx-auto py-8 md:py-16 gap-4 col-span-12">
      <VersionTag version={version} tag="Latest Version" />
      <AnimatedHeading
        className="display text-center text-balance z-10"
        masked
        effectDuration={4}
      >
        The TypeScript framework for building & shipping MCP servers
      </AnimatedHeading>
      <Shader />
      <div
        className="flex items-center justify-center gap-2 invisible"
        ref={buttonsRef}
      >
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
      <div
        className="flex flex-col items-center justify-center gap-4.5 py-8 invisible"
        ref={logosRef}
      >
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
