"use client";

import Link from "next/link";
import { cn } from "@/utils/cn";
import { Icons } from "@/components/icons";

type AuthIconKey = "betterAuth" | "clerk" | "workos" | "auth0";

interface AuthOption {
  label: string;
  icon: AuthIconKey;
  description: string;
  href: string;
}

const AUTH_OPTIONS: AuthOption[] = [
  {
    label: "Better Auth",
    icon: "betterAuth",
    description: "Self-hosted auth with email/password and OAuth",
    href: "/docs/integrations/better-auth",
  },
  {
    label: "Clerk",
    icon: "clerk",
    description: "Third-party auth service with organizations",
    href: "/docs/integrations/clerk",
  },
  {
    label: "WorkOS",
    icon: "workos",
    description: "Enterprise-ready SSO and directory sync",
    href: "/docs/integrations/workos",
  },
];

export function AuthProviders() {
  return (
    <div className="not-prose">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 my-6">
        {AUTH_OPTIONS.map((option) => {
          const IconComponent = Icons[option.icon];
          return (
            <Link
              key={option.label}
              href={option.href}
              className={cn(
                "relative flex flex-col gap-2 px-3 py-3",
                "border border-brand-neutral-600 bg-[rgba(5,5,5,0.85)]",
                "hover:border-brand-neutral-400 hover:bg-[rgba(15,15,15,0.85)]",
                "transition-all duration-200 cursor-pointer text-left overflow-hidden",
                "!no-underline hover:!no-underline [&_*]:!no-underline"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 border border-dashed border-brand-neutral-400 bg-brand-neutral-600 grid place-items-center shrink-0">
                  <IconComponent className="w-4 h-4 text-brand-w1" />
                </span>
                <span className="text-brand-w1 font-medium text-sm relative z-10 no-underline">
                  {option.label}
                </span>
              </div>
              <span className="absolute -right-2 top-1/2 -translate-y-1/2 text-brand-neutral-600 pointer-events-none">
                <IconComponent className="size-12" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
