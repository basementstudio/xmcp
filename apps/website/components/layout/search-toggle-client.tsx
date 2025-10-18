"use client";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { useSearchContext } from "fumadocs-ui/contexts/search";
import { Icons } from "../icons";

interface SearchToggleClientProps extends ComponentProps<"button"> {
  isMac: boolean;
}

export function SearchToggleClient({
  isMac,
  ...props
}: SearchToggleClientProps) {
  const { enabled, setOpenSearch } = useSearchContext();

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
      <span className="text-brand-white ml-auto hidden md:block w-[48px] text-right">
        {isMac ? "⌘K" : "Ctrl K"}
      </span>
    </button>
  );
}
