"use client";

import { useCopyButton } from "fumadocs-ui/utils/use-copy-button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Copy } from "lucide-react";

interface CopyUrlButtonProps {
  url: string;
  className?: string;
  withIcon?: boolean;
}

export function CopyUrlButton({
  url,
  className,
  withIcon = false,
}: CopyUrlButtonProps) {
  const [isCopying, setIsCopying] = useState(false);
  const [copied, triggerCopy] = useCopyButton(async () => {
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(url);
    } finally {
      setIsCopying(false);
    }
  });

  return (
    <button
      type="button"
      onClick={triggerCopy}
      disabled={isCopying}
      className={cn(
        "relative inline-flex items-center gap-1 text-sm font-medium text-brand-neutral-100 disabled:opacity-60 cursor-pointer",
        "min-w-[76px] justify-start",
        className
      )}
      aria-live="polite"
    >
      {withIcon && <Copy className="size-3.5 shrink-0" />}
      <span
        className={cn(
          "block transition-all duration-300 ease-out",
          copied ? "opacity-0 -translate-y-1" : "opacity-100 translate-y-0"
        )}
        aria-hidden={copied}
      >
        URL
      </span>
      <span
        className={cn(
          "absolute left-0 block transition-all duration-300 ease-out pointer-events-none",
          copied ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
        )}
        aria-hidden={!copied}
      >
        Copied
      </span>
    </button>
  );
}
