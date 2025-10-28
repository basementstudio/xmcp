"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { usePathname } from "next/navigation";
import { forwardRef } from "react";
import { track } from "@vercel/analytics";

interface AnimatedLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
  className?: string;
  trackIntent?: string;
  trackLocation?: string;
}

export const AnimatedLink = forwardRef<HTMLAnchorElement, AnimatedLinkProps>(
  (
    { trackIntent, trackLocation, href, children, className = "", ...props },
    ref
  ) => {
    const pathname = usePathname();
    // caveats
    const isActive =
      pathname === href ||
      (href === "/docs" && pathname.startsWith("/docs")) ||
      (href === "/blog" && pathname.startsWith("/blog"));

    const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
      track("link clicked", {
        location: trackLocation || pathname || "unknown",
        intent: trackIntent || "navigation",
        href: href,
      });

      props.onClick?.(event);
    };

    return (
      <Link
        href={href}
        ref={ref}
        {...props}
        className={cn("relative group", className)}
        onClick={handleClick}
      >
        {children}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 h-px bg-white transition-transform duration-200 ease-out",
            "scale-x-0 origin-right",
            "group-hover:scale-x-100 group-hover:origin-left",
            isActive && "scale-x-100 origin-left"
          )}
        />
      </Link>
    );
  }
);

AnimatedLink.displayName = "AnimatedLink";
