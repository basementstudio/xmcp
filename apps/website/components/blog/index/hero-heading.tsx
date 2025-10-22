"use client";

import { AnimatedHeading } from "@/components/ui/animated-heading";
import { useFadeIn } from "@/lib/anim/use-fade-in";
import { useRef } from "react";

export function BlogHeroHeading() {
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
        ref={headingRef}
        className="display text-center text-balance z-10 invisible"
      >
        Blog
      </AnimatedHeading>
      <p
        className="text-brand-neutral-100 text-base col-span-12 max-w-[650px] lg:col-span-5 mt-auto text-center invisible"
        ref={descriptionRef}
      >
        Read the latest updates, guides, and insights about xmcp.
      </p>
    </>
  );
}
