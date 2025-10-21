"use client";

import { useRef } from "react";
import { AnimatedHeading } from "@/components/ui/animated-heading";
import { useFadeIn } from "@/lib/anim/use-fade-in";

export function ExamplesHeroHeading() {
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  useFadeIn({
    refs: [descriptionRef],
    yOffset: 8,
    delay: 0.2,
  });

  return (
    <>
      <AnimatedHeading
        effectDuration={2}
        className="display text-center text-balance z-10"
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
