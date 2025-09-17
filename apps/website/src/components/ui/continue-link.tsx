import * as React from "react";
import Link from "next/link";
import { cn } from "@/utils/cn";

export interface ContinueLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
}

const ContinueLink = React.forwardRef<HTMLAnchorElement, ContinueLinkProps>(
  ({ className, href, children, ...props }, ref) => {
    return (
      <Link
        ref={ref}
        href={href}
        className={cn(
          "inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors",
          "border-l-2 border-primary/20 pl-3 py-1",
          "hover:border-primary/40",
          className
        )}
        {...props}
      >
        {children}
      </Link>
    );
  }
);
ContinueLink.displayName = "ContinueLink";

export { ContinueLink };
