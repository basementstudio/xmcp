"use client";

import Link from "next/link";
import { cn } from "@/utils/cn";
import { usePathname } from "next/navigation";

interface AnimatedLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const AnimatedLink = ({
  href,
  children,
  className = "",
  ...props
}: AnimatedLinkProps) => {
  const pathname = usePathname();
  // caveat for blog posts
  const isActive =
    pathname === href || (href === "/blog" && pathname.startsWith("/blog"));

  return (
    <Link
      href={href}
      {...props}
      className={cn("relative group uppercase font-mono", className)}
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
};
