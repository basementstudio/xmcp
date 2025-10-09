"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "../../utils/cn";
import { Icons } from "../icons";

export const CopyButton = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => {
  const [copied, setCopied] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCopiedRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      await navigator.clipboard.writeText(text);
      setCopied(true);
      lastCopiedRef.current = Date.now();

      timeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  return (
    <div
      className={cn("relative grid justify-items-center", className)}
      onMouseEnter={() => {
        if (copied && Date.now() - lastCopiedRef.current > 500) {
          setCopied(false);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        }
      }}
    >
      <button
        className={cn(
          "absolute size-6 grid place-items-center z-20 cursor-pointer transition-all duration-300 group"
        )}
        onClick={handleCopy}
        aria-label="Copy to clipboard"
      >
        <div className="relative size-full grid place-items-center">
          <Icons.check
            className={cn(
              "absolute size-4 w-auto transition-all duration-300 will-change-transform [&_path]:fill-white",
              copied
                ? "opacity-100 scale-100 animate-in fade-in"
                : "opacity-0 scale-30 animate-out fade-out"
            )}
          />
          <Icons.copy
            className={cn(
              "absolute size-4 transition-all duration-300 will-change-transform [&_path]:fill-white/50 group-hover:[&_path]:fill-white",
              copied
                ? "opacity-0 scale-30 animate-out fade-out"
                : "opacity-100 scale-100 animate-in fade-in"
            )}
          />
        </div>
      </button>
    </div>
  );
};
