"use client";

import Link from "next/link";
import { Icons } from "@/components/icons";

type IconKey = keyof typeof Icons;

export interface ActionCardProps {
  label: string;
  icon: IconKey;
  onClick?: () => void;
  href?: string;
}

export function ActionCard({ label, icon, onClick, href }: ActionCardProps) {
  const IconComponent = Icons[icon];

  const content = (
    <span className="site-card-surface relative flex h-full w-full items-center gap-3 overflow-hidden px-3 py-2.5">
      <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-md border border-dashed border-brand-neutral-500 bg-brand-neutral-600">
        <IconComponent
          aria-hidden="true"
          className="size-[15px] text-brand-white"
        />
      </span>
      <span className="site-card-title relative z-10 min-w-0">{label}</span>
    </span>
  );

  const className =
    "site-content-card group block h-full w-full min-w-0 cursor-pointer rounded-xl text-left";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}
