import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface AccordionItemProps extends Omit<ComponentProps<"details">, "title"> {
  name: string;
  index: number;
  title: ReactNode;
}

export function AccordionItem({
  name,
  index,
  title,
  className,
  children,
  ...props
}: AccordionItemProps) {
  return (
    // A shared name lets the browser keep just one item open in each group.
    <details
      {...props}
      name={name}
      className={cn("site-accordion-item", className)}
    >
      <summary>
        <span className="site-accordion-index" aria-hidden="true">
          {String(index).padStart(2, "0")}
        </span>
        {title}
      </summary>
      {children}
    </details>
  );
}
