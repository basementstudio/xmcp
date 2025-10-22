"use client";

import { useRef } from "react";
import { AnimatedHeading } from "@/components/ui/animated-heading";
import { useFadeIn } from "@/lib/anim/use-fade-in";

export function ExamplesHeroHeading() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  useFadeIn({
    refs: [headingRef, descriptionRef],
    yOffset: 15,
  });

  return (
    <>
      <AnimatedHeading
        effectDuration={2}
        className="display text-center text-balance z-10 invisible"
        ref={headingRef}
      >
        Examples & templates
      </AnimatedHeading>
      <p
        className="text-brand-neutral-100 text-base col-span-12 max-w-[650px] lg:col-span-5 mt-auto text-center invisible"
        ref={descriptionRef}
      >
        Quickstart guides and examples to get you started with xmcp with
        real-world implementations and best practices.
      </p>
    </>
  );
}
