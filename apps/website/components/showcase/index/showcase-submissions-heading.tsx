"use client";

import { Tag } from "@/components/ui/tag";
import { AnimatedHeading } from "@/components/ui/animated-heading";
import { useRef } from "react";
import { useFadeIn } from "@/lib/anim/use-fade-in";

export function ShowcaseSubmissionsHeading() {
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  useFadeIn({
    refs: [descriptionRef],
    yOffset: 20,
    delay: 0.1,
  });

  return (
    <>
      <Tag text="Submissions are open" animate />
      <div className="grid grid-cols-12 lg:grid-cols-9 gap-4 md:gap-8 w-full">
        <AnimatedHeading
          as="h2"
          effectDuration={2}
          className="heading-2 text-balance col-span-12 lg:col-span-4 mt-auto text-gradient"
        >
          Showcase your MCP server
        </AnimatedHeading>
        <p
          className="text-brand-neutral-100 text-base col-span-12 max-w-[650px] lg:col-span-5 mt-auto invisible"
          ref={descriptionRef}
        >
          Built something amazing with xmcp? Share it with the community and get
          featured in our showcase.
        </p>
      </div>
    </>
  );
}
