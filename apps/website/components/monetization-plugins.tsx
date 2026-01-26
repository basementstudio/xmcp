"use client";

import Link from "next/link";
import { cn } from "@/utils/cn";
import { Icons } from "@/components/icons";

interface MonetizationPlugin {
  label: string;
  icon: keyof typeof Icons;
  href: string;
  paymentModel: string;
}

const MONETIZATION_PLUGINS: MonetizationPlugin[] = [
  {
    label: "Polar",
    icon: "polar",
    href: "/docs/integrations/polar",
    paymentModel: "License keys",
  },
  {
    label: "x402",
    icon: "x402",
    href: "/docs/integrations/x402",
    paymentModel: "USDC on Base",
  },
];

export function MonetizationPlugins() {
  return (
    <div className="not-prose">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-6">
        {MONETIZATION_PLUGINS.map((plugin) => {
          const IconComponent = Icons[plugin.icon];
          return (
            <Link
              key={plugin.label}
              href={plugin.href}
              className={cn(
                "relative flex flex-col gap-2 p-4",
                "border border-brand-neutral-600 bg-[rgba(5,5,5,0.85)]",
                "hover:border-brand-neutral-400 hover:bg-[rgba(15,15,15,0.85)]",
                "transition-all duration-200 cursor-pointer overflow-hidden",
                "no-underline hover:no-underline !decoration-transparent hover:!decoration-transparent"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 border border-dashed border-brand-neutral-400 bg-brand-neutral-600 grid place-items-center shrink-0">
                  <IconComponent className="w-4 h-4 text-brand-w1" />
                </span>
                <span className="text-brand-w1 font-medium text-sm">
                  {plugin.label}
                </span>
              </div>
              <span className="absolute -right-2 top-1/2 -translate-y-1/2 text-brand-neutral-600 pointer-events-none opacity-50">
                <IconComponent className="size-16" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
