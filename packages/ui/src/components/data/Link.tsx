import React from "react";
import type { LinkProps } from "../../schema/types.js";
import { Link as BaseLink } from "../../react/index.js";

export function Link({
  href,
  label,
  external = true,
  className,
}: LinkProps) {
  return (
    <BaseLink
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={className}
    >
      {label}
      {external ? (
        <svg
          className="h-3 w-3"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5zm7.25-.75a.75.75 0 01.75-.75h3.25a.75.75 0 01.75.75v3.25a.75.75 0 01-1.5 0v-1.44l-5.22 5.22a.75.75 0 01-1.06-1.06l5.22-5.22h-1.44a.75.75 0 01-.75-.75z"
            clipRule="evenodd"
          />
        </svg>
      ) : null}
    </BaseLink>
  );
}

export default Link;
