"use client";

import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import type { VariantProps } from "class-variance-authority";
import { Icons } from "@/components/icons";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  ChevronDownIcon as ArrowDownIcon,
  ExternalLinkIcon as ExternalLink,
  LayersIcon as Layers,
} from "@/components/ui/site-icons";

export type DeployProvider =
  | "vercel"
  | "alpic"
  | "replit"
  | "netlify"
  | "railway"
  | "render"
  | "cloudflare"
  | "other";

export type DeployOption = {
  label: string;
  href: string;
  provider: DeployProvider;
  /** Opens the docs deployment guide instead of a one-click deploy. */
  guide?: boolean;
  disabled?: boolean;
};

const itemClassName =
  "w-full text-sm cursor-pointer px-2 py-1.5 text-brand-neutral-100 hover:bg-brand-neutral-500 hover:text-brand-white data-[highlighted]:bg-brand-neutral-500 data-[highlighted]:text-brand-white focus:outline-none focus:ring-0 focus:shadow-none border-0 outline-none ring-0 shadow-none transition-colors duration-200 flex items-center gap-2 rounded-md";

export function DeployDropdown({
  options,
  variant = "secondary",
}: {
  options: DeployOption[];
  variant?: VariantProps<typeof buttonVariants>["variant"];
}) {
  if (options.length === 0) {
    return null;
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size="sm"
          className="group h-10 md:h-8 w-auto md:w-[90px] min-w-0 rounded-md pl-3.5 md:pl-3 pr-2.5 md:pr-2 pt-1.5 pb-1.5 gap-2 text-sm"
        >
          <span>Deploy</span>
          <ArrowDownIcon className="h-[5px] w-[10px] transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="z-50 rounded-lg !bg-brand-neutral-600 opacity-100 border border-brand-neutral-400 text-brand-neutral-50 p-1 min-w-[196px] shadow-lg backdrop-blur-none overflow-hidden [&_*:focus-visible]:outline-none [&_*:focus-visible]:ring-0 [&_*:focus-visible]:outline-offset-0"
      >
        {options.map((option) =>
          option.disabled ? (
            <DropdownMenuItem
              key={`${option.provider}-disabled`}
              disabled
              className="w-full text-sm px-2 py-1.5 text-brand-neutral-300 opacity-50 cursor-not-allowed flex items-center gap-2"
            >
              <ProviderIcon provider={option.provider} />
              <span>{option.label}</span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              key={`${option.provider}-${option.href}`}
              asChild
              className="outline-none data-[highlighted]:bg-brand-neutral-500"
            >
              {option.guide ? (
                <Link href={option.href} className={itemClassName}>
                  <ProviderIcon provider={option.provider} />
                  <span>{option.label}</span>
                  <span className="ml-auto text-xs text-brand-neutral-200">
                    Guide
                  </span>
                </Link>
              ) : (
                <Link
                  href={option.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={itemClassName}
                >
                  <ProviderIcon provider={option.provider} />
                  <span>{option.label}</span>
                </Link>
              )}
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The same provider marks as the docs' Deployment section. */
function ProviderIcon({ provider }: { provider: DeployProvider }) {
  switch (provider) {
    case "vercel":
      return <Icons.vercel />;
    case "cloudflare":
      return <Icons.cloudflare />;
    case "alpic":
      return <Icons.alpic />;
    case "replit":
      return <Icons.replit />;
    case "railway":
      return <Icons.railway />;
    case "render":
      return <Icons.render />;
    case "netlify":
      return <Layers className="site-icon" />;
    default:
      return <ExternalLink className="site-icon" />;
  }
}
