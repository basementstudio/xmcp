import type { HTMLAttributes } from "react";
import { Link2Icon } from "@/components/ui/site-icons";
import { cn } from "@/lib/cn";

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
function heading(Tag: HeadingTag) {
  return function Heading({
    id,
    className,
    children,
    ...props
  }: HTMLAttributes<HTMLHeadingElement>) {
    return (
      <Tag id={id} className={cn("scroll-m-28", className)} {...props}>
        {id ? (
          <a
            data-card=""
            href={`#${id}`}
            className="group inline-flex items-center gap-2"
          >
            <span>{children}</span>
            <Link2Icon className="text-brand-neutral-200 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
          </a>
        ) : (
          children
        )}
      </Tag>
    );
  };
}

export const headingComponents = {
  h1: heading("h1"),
  h2: heading("h2"),
  h3: heading("h3"),
  h4: heading("h4"),
  h5: heading("h5"),
  h6: heading("h6"),
};
