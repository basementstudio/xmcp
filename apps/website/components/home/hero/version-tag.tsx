"use client";

import Link from "next/link";
import { Tag } from "@/components/ui/tag";
import { useFadeIn } from "@/lib/anim/use-fade-in";
import { useRef } from "react";

export function VersionTag({
  version,
  tag,
}: {
  version: string;
  tag?: string;
}) {
  const tagRef = useRef<HTMLAnchorElement>(null);

  useFadeIn({
    refs: [tagRef],
    delay: 0.2,
    yOffset: 0,
  });

  return (
    <Link
      className="flex items-center justify-center gap-2 z-10 text-xs group invisible"
      href="https://npmjs.com/package/xmcp"
      target="_blank"
      ref={tagRef}
    >
      {version ? ` v${version}` : ""}
      <Tag
        text={tag}
        className="group-hover:border-brand-neutral-200 group-hover:text-brand-neutral-50 transition-colors duration-200"
        animate
      />
    </Link>
  );
}
