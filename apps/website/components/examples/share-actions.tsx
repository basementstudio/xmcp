"use client";

import Link from "next/link";
import { useRef, useState } from "react";

type ShareTarget = "github" | "page";

export function ExampleShareActions({
  pageUrl,
  repositoryUrl,
  xShareUrl,
}: {
  pageUrl: string;
  repositoryUrl: string;
  xShareUrl: string;
}) {
  const [activeSuccess, setActiveSuccess] = useState<ShareTarget | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerSuccess = (target: ShareTarget) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setActiveSuccess(target);
    timeoutRef.current = setTimeout(() => {
      setActiveSuccess((current) => (current === target ? null : current));
    }, 1200);
  };

  const copyToClipboard = async (target: ShareTarget, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      triggerSuccess(target);
    } catch {
      // no-op if clipboard is unavailable
    }
  };

  return (
    <div className="text-brand-neutral-50">
      <Link
        href={xShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-brand-white"
      >
        Twitter
      </Link>
      <span>{", "}</span>
      <button
        type="button"
        onClick={() => copyToClipboard("github", repositoryUrl)}
        className="underline underline-offset-2 hover:text-brand-white cursor-pointer"
      >
        <span>GitHub</span>
        <span
          aria-hidden
          className={`relative top-[4px] inline-block overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin-left] duration-250 ease-out ${
            activeSuccess === "github"
              ? "ml-1 max-w-3 opacity-100"
              : "ml-0 max-w-0 opacity-0"
          }`}
        >
          ✓
        </span>
      </button>
      <span>{", "}</span>
      <button
        type="button"
        onClick={() => copyToClipboard("page", pageUrl)}
        className="underline underline-offset-2 hover:text-brand-white cursor-pointer"
      >
        <span>Link</span>
        <span
          aria-hidden
          className={`relative top-[4px] inline-block overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin-left] duration-250 ease-out ${
            activeSuccess === "page"
              ? "ml-1 max-w-3 opacity-100"
              : "ml-0 max-w-0 opacity-0"
          }`}
        >
          ✓
        </span>
      </button>
    </div>
  );
}
