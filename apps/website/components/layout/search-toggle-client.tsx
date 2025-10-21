"use client";

import { cn } from "../../lib/cn";
import { useSearchContext } from "fumadocs-ui/contexts/search";
import { useEffect, useState } from "react";
import { detectWindowsFromClient } from "@/utils/detect-os";
import { Icons } from "../icons";

export function SearchToggleClient({ ...props }) {
  const { enabled, setOpenSearch } = useSearchContext();
  const [isWindows, setIsWindows] = useState<boolean | null>(null);

  useEffect(() => {
    setIsWindows(detectWindowsFromClient());
  }, []);

  if (!enabled) return null;

  return (
    <button
      {...props}
      className={cn(
        "p-2 border-transparent border sm:border-brand-neutral-400 text-start flex items-center gap-2 text-brand-neutral-200 text-sm hover:bg-white/10 rounded-xs",
        "transition-colors duration-200 ease-in-out cursor-pointer",
        props.className
      )}
      onClick={() => setOpenSearch(true)}
    >
      <Icons.search className="size-4" />
      <span className="lg:block hidden">Search docs...</span>
      <span className="hidden sm:block lg:hidden">Search...</span>
      <span
        className={cn(
          "text-brand-white ml-auto hidden md:block w-[48px] text-right",
          "transition-opacity duration-200 ease-in-out"
        )}
      >
        {isWindows ? "Ctrl K" : "⌘K"}
      </span>
    </button>
  );
}
