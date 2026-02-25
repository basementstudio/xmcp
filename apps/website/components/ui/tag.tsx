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
    "py-1 px-2 text-[0.625rem] uppercase border tracking-wide transition-colors duration-200";

  if (!interactive) {
    return cn(
      base,
      "bg-brand-neutral-600 border-dashed border-brand-neutral-400 text-brand-neutral-100"
    );
  }

  if (selected) {
    return cn(
      base,
      "bg-brand-neutral-600 border-solid border-brand-white text-brand-white"
    );
  }

  return cn(
    base,
    "bg-transparent border-dashed border-brand-neutral-400 text-brand-neutral-100 hover:text-brand-white hover:border-solid hover:border-brand-neutral-300 hover:bg-brand-neutral-600"
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
    interactive && "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-white/70",
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {text}
      </Link>
    );
  }

  return (
    <div className={classes}>
      {text}
    </div>
  );
};
