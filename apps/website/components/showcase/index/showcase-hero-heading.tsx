"use client";

import { useFadeIn } from "@/lib/anim/use-fade-in";
import { AnimatedHeading } from "@/components/ui/animated-heading";
import { useRef } from "react";

export function ShowcaseHeroHeading() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  useFadeIn({
    refs: [headingRef, descriptionRef],
    yOffset: 12,
  });

  return (
    <>
      <AnimatedHeading
        effectDuration={2}
        className="display text-center text-balance z-10 invisible"
        ref={headingRef}
      >
        Community MCP servers
      </AnimatedHeading>
      <p
        className="text-brand-neutral-100 text-base col-span-12 max-w-[650px] lg:col-span-5 mt-auto text-center invisible"
        ref={descriptionRef}
      >
        Explore the first wave of production-ready MCP servers built by
        developers worldwide.
      </p>
    </>
  );
}
