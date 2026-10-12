import { cn } from "@/lib/utils";
import Link from "next/link";

type TagProps = {
  text?: string;
  className?: string;
  href?: string;
  interactive?: boolean;
  selected?: boolean;
};

export function tagClassName({
  interactive = false,
  selected = false,
}: {
  interactive?: boolean;
  selected?: boolean;
}) {
  const base =
    "site-chip py-1 px-2.5 text-[12px] leading-[18px] rounded-full border border-transparent transition-colors duration-200";

  if (!interactive) {
    return cn(base, "bg-brand-neutral-600 text-brand-neutral-100");
  }

  if (selected) {
    return cn(base, "site-chip-selected");
  }

  return cn(
    base,
    "bg-brand-neutral-600 text-brand-neutral-100 hover:text-brand-white hover:bg-brand-neutral-500"
  );
}

export const Tag = ({
  text,
  className,
  href,
  interactive = Boolean(href),
  selected = false,
}: TagProps) => {
  const classes = cn(
    tagClassName({ interactive, selected }),
    interactive &&
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-white/70",
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {text}
      </Link>
    );
  }

  return <div className={classes}>{text}</div>;
};
