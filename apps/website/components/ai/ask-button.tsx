"use client";

import {
  lazy,
  Suspense,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { cn } from "@/lib/cn";
import { Icons } from "../icons";
import { detectWindowsFromClient } from "@/utils/detect-os";

const loadDialog = () => import("./ask-dialog");
const AskAIDialog = lazy(() =>
  loadDialog().then((module) => ({ default: module.AskAIDialog }))
);
const warmDialog = () => {
  void loadDialog().catch(() => {});
};

// The platform does not change during a visit; only hydration needs a snapshot.
const subscribePlatform = () => () => {};
const serverPlatform = () => null;

export function AskAIButtonClient() {
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const isWindows = useSyncExternalStore(
    subscribePlatform,
    detectWindowsFromClient,
    serverPlatform
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+I (Mac) or Ctrl+I (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "i") {
        e.preventDefault();
        setHasOpened(true);
        setOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      {/* Header button - visible from sm: and up */}
      <button
        className={cn(
          "hidden sm:flex",
          "p-2 border border-brand-neutral-400 flex-1",
          "items-center gap-2 text-brand-neutral-200 text-sm",
          "hover:bg-white/10 rounded-xs bg-brand-black",
          "transition-colors duration-200 ease-in-out cursor-pointer"
        )}
        onPointerEnter={warmDialog}
        onFocus={warmDialog}
        onClick={() => {
          setHasOpened(true);
          setOpen(true);
        }}
      >
        Ask AI
        <span
          className={cn(
            "text-brand-white ml-2 w-[48px] inline-block text-right",
            "transition-opacity duration-200 ease-in-out"
          )}
        >
          {isWindows ? "Ctrl I" : "⌘I"}
        </span>
      </button>

      {/* Fixed bottom-right button - visible only on mobile */}
      <button
        className={cn(
          "sm:hidden fixed bottom-6 right-6 z-50",
          "p-3 border border-brand-neutral-400",
          "flex items-center gap-2 text-brand-neutral-200 text-sm",
          "hover:bg-white/10 rounded-xs bg-brand-black",
          "transition-colors duration-200 ease-in-out cursor-pointer",
          "shadow-lg"
        )}
        onPointerEnter={warmDialog}
        onFocus={warmDialog}
        onClick={() => {
          setHasOpened(true);
          setOpen(true);
        }}
        aria-label="Ask AI"
      >
        <Icons.chat className="size-4" />{" "}
      </button>

      {hasOpened && (
        <Suspense
          fallback={
            <span role="status" className="sr-only">
              Loading chat…
            </span>
          }
        >
          <AskAIDialog open={open} onOpenChange={setOpen} />
        </Suspense>
      )}
    </>
  );
}
