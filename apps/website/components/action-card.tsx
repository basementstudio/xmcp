"use client";

import Link from "next/link";
import { cn } from "@/utils/cn";
import { Icons } from "@/components/icons";

type ClientIconKey = "cursor" | "claude" | "windsurf" | "gemini" | "codex";

export interface ActionCardProps {
  label: string;
  icon: ClientIconKey;
  onClick?: () => void;
  href?: string;
}

export function ActionCard({ label, icon, onClick, href }: ActionCardProps) {
  const IconComponent = Icons[icon];

  const content = (
    <>
      <span className="w-8 h-8 border border-dashed border-brand-neutral-400 bg-brand-neutral-600 grid place-items-center shrink-0">
        <IconComponent className="w-4 h-4 text-brand-w1" />
      </span>
      <span className="text-brand-w1 font-medium text-sm relative z-10">
        {label}
      </span>
      <span className="absolute -right-2 top-1/2 -translate-y-1/2 text-brand-neutral-600 pointer-events-none">
        <IconComponent className="size-12" />
      </span>
    </>
  );

  const className = cn(
    "relative flex items-center gap-3 px-3 py-2.5",
    "border border-brand-neutral-600 bg-[rgba(5,5,5,0.85)]",
    "hover:border-brand-neutral-400",
    "cursor-pointer text-left overflow-hidden",
    "no-underline hover:no-underline !decoration-transparent hover:!decoration-transparent",
    "hover:!text-brand-w1 !opacity-100 hover:!opacity-100"
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
}
