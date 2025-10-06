"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { AskAIDialog } from "./ask-dialog";
import { Icons } from "../icons";

export function AskAIButton() {
  const [isMac, setIsMac] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+I (Mac) or Ctrl+I (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "i") {
        e.preventDefault();
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
          "p-2 border border-brand-neutral-200 flex-1",
          "items-center gap-2 text-brand-neutral-100 text-sm",
          "hover:bg-[#1B191A] rounded-xs bg-brand-black",
          "transition-colors duration-200 ease-in-out cursor-pointer"
        )}
        onClick={() => setOpen(true)}
      >
        Ask AI
        <span className="text-brand-white ml-2">{isMac ? "⌘I" : "Ctrl I"}</span>
      </button>

      {/* Fixed bottom-right button - visible only on mobile */}
      <button
        className={cn(
          "sm:hidden fixed bottom-6 right-6 z-50",
          "p-3 border border-brand-neutral-200",
          "flex items-center gap-2 text-brand-neutral-100 text-sm",
          "hover:bg-[#1B191A] rounded-xs bg-brand-black",
          "transition-colors duration-200 ease-in-out cursor-pointer",
          "shadow-lg"
        )}
        onClick={() => setOpen(true)}
        aria-label="Ask AI"
      >
        <Icons.chat className="size-4" />{" "}
      </button>

      <AskAIDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
