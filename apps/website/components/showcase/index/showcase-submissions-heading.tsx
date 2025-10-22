"use client";

import { Tag } from "@/components/ui/tag";
import { AnimatedHeading } from "@/components/ui/animated-heading";
import { useFadeIn } from "@/lib/anim/use-fade-in";
import { useRef } from "react";

export function ShowcaseSubmissionsHeading() {
  const containerRef = useRef<HTMLDivElement>(null);

  useFadeIn({
    refs: [containerRef],
  });

  return (
    <div
      className="flex flex-col items-start justify-center col-span-12 lg:col-span-9 lg:col-start-2 w-full mx-auto mb-8 gap-3 invisible"
      ref={containerRef}
    >
      <Tag text="Submissions are open" animate />
      <div className="grid grid-cols-12 lg:grid-cols-9 gap-4 md:gap-8 w-full">
        <AnimatedHeading
          as="h2"
          effectDuration={2}
          className="heading-2 text-balance col-span-12 lg:col-span-4 mt-auto"
        >
          Showcase your MCP server
        </AnimatedHeading>
        <p className="text-brand-neutral-100 text-base col-span-12 max-w-[650px] lg:col-span-5 mt-auto">
          Built something amazing with xmcp? Share it with the community and get
          featured in our showcase.
        </p>
      </div>
    </div>
  );
}
