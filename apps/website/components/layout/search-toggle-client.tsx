"use client";

import { cn } from "../../lib/cn";
import { useSearchContext } from "fumadocs-ui/contexts/search";
import { useSyncExternalStore, type ComponentProps } from "react";
import { detectWindowsFromClient } from "@/utils/detect-os";
import { Icons } from "../icons";

// The platform is stable for the lifetime of this page.
const subscribeToPlatform = () => () => {};
const serverPlatform = () => false;

export function SearchToggleClient({
  className,
  ...props
}: ComponentProps<"button">) {
  const { enabled, setOpenSearch } = useSearchContext();
  const isWindows = useSyncExternalStore(
    subscribeToPlatform,
    detectWindowsFromClient,
    serverPlatform
  );

  if (!enabled) return null;

  return (
    <button
      {...props}
      type="button"
      className={cn("site-search-trigger", className)}
      aria-label="Search documentation"
      aria-haspopup="dialog"
      onClick={() => setOpenSearch(true)}
    >
      <Icons.search className="size-4 shrink-0" aria-hidden="true" />
      <span className="site-search-trigger-label">Search docs</span>
      <kbd className="site-search-shortcut" aria-hidden="true">
        {isWindows ? "Ctrl K" : "⌘ K"}
      </kbd>
    </button>
  );
}
