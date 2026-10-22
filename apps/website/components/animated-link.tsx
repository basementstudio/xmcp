"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { usePathname } from "next/navigation";
import { forwardRef } from "react";
import { track } from "@vercel/analytics";

interface AnimatedLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
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
        // The homepage preloads WebGL assets; do not fetch them on unrelated pages.
        prefetch={href === "/" ? false : undefined}
        ref={ref}
        {...props}
        className={cn("link-underline-group", className)}
        data-active={isActive || undefined}
        onClick={handleClick}
      >
        <span className="link-underline-label">{children}</span>
      </Link>
    );
  }
);

AnimatedLink.displayName = "AnimatedLink";
