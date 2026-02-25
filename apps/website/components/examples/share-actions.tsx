"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, Link2, Linkedin } from "lucide-react";
import { cn } from "@/lib/utils";

type ShareTarget = "url" | "x" | "linkedin";

export function ExampleShareActions({
  pageUrl,
  xShareUrl,
  linkedinShareUrl,
}: {
  pageUrl: string;
  xShareUrl: string;
  linkedinShareUrl: string;
}) {
  const [activeSuccess, setActiveSuccess] = useState<ShareTarget | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const triggerSuccess = (target: ShareTarget) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setActiveSuccess(target);
    timeoutRef.current = setTimeout(() => {
      setActiveSuccess((current) => (current === target ? null : current));
    }, 1200);
  };

  return (
    <div className="flex items-center gap-4">
      <ShareIconLink
        href={xShareUrl}
        label="Share on X"
        isSuccess={activeSuccess === "x"}
        onClick={() => triggerSuccess("x")}
        icon={<XIcon className="size-4" />}
      />
      <ShareIconLink
        href={linkedinShareUrl}
        label="Share on LinkedIn"
        isSuccess={activeSuccess === "linkedin"}
        onClick={() => triggerSuccess("linkedin")}
        icon={<Linkedin className="size-4" />}
      />
      <ShareIconButton
        label="Copy URL"
        isSuccess={activeSuccess === "url"}
        onClick={async () => {
          await navigator.clipboard.writeText(pageUrl);
          triggerSuccess("url");
        }}
        icon={<Link2 className="size-4" />}
      />
    </div>
  );
}

function ShareIconLink({
  href,
  label,
  isSuccess,
  onClick,
  icon,
}: {
  href: string;
  label: string;
  isSuccess: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      onClick={onClick}
      className="relative inline-flex size-4 items-center justify-center text-brand-neutral-100 hover:text-brand-white transition-colors"
    >
      <span
        aria-hidden={isSuccess}
        className={cn(
          "absolute transition-all duration-250 ease-out",
          isSuccess
            ? "opacity-0 scale-75 -rotate-12"
            : "opacity-100 scale-100 rotate-0"
        )}
      >
        {icon}
      </span>
      <Check
        aria-hidden={!isSuccess}
        className={cn(
          "absolute size-4 transition-all duration-250 ease-out",
          isSuccess
            ? "opacity-100 scale-100 rotate-0"
            : "opacity-0 scale-75 rotate-12"
        )}
      />
    </Link>
  );
}

function ShareIconButton({
  label,
  isSuccess,
  onClick,
  icon,
}: {
  label: string;
  isSuccess: boolean;
  onClick: () => void | Promise<void>;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="relative inline-flex size-4 items-center justify-center text-brand-neutral-100 hover:text-brand-white transition-colors cursor-pointer"
    >
      <span
        aria-hidden={isSuccess}
        className={cn(
          "absolute transition-all duration-250 ease-out",
          isSuccess
            ? "opacity-0 scale-75 -rotate-12"
            : "opacity-100 scale-100 rotate-0"
        )}
      >
        {icon}
      </span>
      <Check
        aria-hidden={!isSuccess}
        className={cn(
          "absolute size-4 transition-all duration-250 ease-out",
          isSuccess
            ? "opacity-100 scale-100 rotate-0"
            : "opacity-0 scale-75 rotate-12"
        )}
      />
    </button>
  );
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M18.901 2H21.998L14.983 10.016L23.234 22H16.773L11.715 14.746L5.369 22H2.27L9.775 13.425L1.859 2H8.484L13.056 8.693L18.901 2ZM17.814 20.027H19.53L7.552 3.87H5.711L17.814 20.027Z" />
    </svg>
  );
}
