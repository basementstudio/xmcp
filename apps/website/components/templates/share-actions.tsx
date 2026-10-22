"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icons } from "@/components/icons";
import {
  CheckIcon,
  GitHubLogoIcon,
  Link2Icon,
} from "@/components/ui/site-icons";

type ShareTarget = "github" | "page";

// Long enough to read "Copied" before the label returns.
const COPIED_FEEDBACK_MS = 1200;

export function TemplateShareActions({
  pageUrl,
  repositoryUrl,
  xShareUrl,
}: {
  pageUrl: string;
  repositoryUrl: string;
  xShareUrl: string;
}) {
  const [copied, setCopied] = useState<ShareTarget | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const copy = async (target: ShareTarget, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      return;
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setCopied(target);
    timeoutRef.current = setTimeout(() => {
      setCopied((current) => (current === target ? null : current));
    }, COPIED_FEEDBACK_MS);
  };

  return (
    <div className="template-share">
      <Link
        href={xShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="template-share-button"
      >
        <Icons.x className="size-3" aria-hidden="true" />
        Post on X
      </Link>
      <button
        type="button"
        onClick={() => copy("github", repositoryUrl)}
        className="template-share-button"
      >
        {copied === "github" ? <CheckIcon /> : <GitHubLogoIcon />}
        <span aria-live="polite">
          {copied === "github" ? "Copied" : "Copy repo URL"}
        </span>
      </button>
      <button
        type="button"
        onClick={() => copy("page", pageUrl)}
        className="template-share-button"
      >
        {copied === "page" ? <CheckIcon /> : <Link2Icon />}
        <span aria-live="polite">
          {copied === "page" ? "Copied" : "Copy page link"}
        </span>
      </button>
    </div>
  );
}
