"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "../../utils/cn";
import { Icons } from "../icons";

// Leave the success/error message long enough to read, then allow another copy.
const COPY_FEEDBACK_MS = 2000;

export function CopyButton({
  text,
  className,
  label = false,
}: {
  text: string | (() => string);
  className?: string;
  label?: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timeout.current) clearTimeout(timeout.current);
    },
    []
  );

  async function copy() {
    if (timeout.current) clearTimeout(timeout.current);
    try {
      await navigator.clipboard.writeText(
        typeof text === "function" ? text() : text
      );
      setStatus("copied");
    } catch {
      setStatus("error");
    }
    timeout.current = setTimeout(() => setStatus("idle"), COPY_FEEDBACK_MS);
  }

  const message =
    status === "copied"
      ? "Copied"
      : status === "error"
        ? "Copy failed"
        : "Copy";
  return (
    <button
      type="button"
      className={cn("site-copy", label && "site-copy-label", className)}
      onClick={copy}
      aria-label={status === "idle" ? "Copy to clipboard" : message}
      title={message}
    >
      {label ? (
        <span>{message}</span>
      ) : status === "copied" ? (
        <Icons.check className="size-4" />
      ) : (
        <Icons.copy className="size-4" />
      )}
      <span className="sr-only" role="status">
        {status !== "idle" ? message : ""}
      </span>
    </button>
  );
}
