"use client";

import Image from "next/image";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import {
  ChevronDown,
  Cloud,
  ExternalLink,
  Layers,
  Rocket,
  Train,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { VariantProps } from "class-variance-authority";

export type DeployProvider =
  | "vercel"
  | "alpic"
  | "netlify"
  | "railway"
  | "render"
  | "cloudflare"
  | "other";

export type DeployOption = {
  label: string;
  href: string;
  provider: DeployProvider;
};

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size="sm" className="px-4">
          <span className="inline-flex items-center gap-1.5">
            <span>Deploy</span>
            <ChevronDown className="size-3.5" />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-brand-neutral-600 border border-brand-neutral-400 text-brand-neutral-50 p-1 w-[var(--radix-dropdown-menu-trigger-width)] min-w-0 [&_*:focus-visible]:outline-none [&_*:focus-visible]:ring-0 [&_*:focus-visible]:outline-offset-0"
      >
        {options.map((option) => (
          <DropdownMenuItem
            key={`${option.provider}-${option.href}`}
            asChild
            className="outline-none border-none data-[highlighted]:outline-none data-[highlighted]:border-none"
          >
            <Link
              href={option.href}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-sm cursor-pointer px-2 py-1.5 text-brand-neutral-100 hover:bg-brand-neutral-500 hover:text-brand-white focus:outline-none focus:ring-0 border-none transition-colors duration-200 inline-flex items-center gap-2"
            >
              <ProviderIcon provider={option.provider} />
              <span>{option.label}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProviderIcon({ provider }: { provider: DeployProvider }) {
  switch (provider) {
    case "vercel":
      return <VercelMarkIcon className="size-3.5" />;
    case "alpic":
      return (
        <Image
          src="https://avatars.githubusercontent.com/u/206831205?s=200&v=4"
          alt="Alpic"
          width={14}
          height={14}
          className="size-3.5 rounded-[2px]"
        />
      );
    case "netlify":
      return <Layers className="size-3.5" />;
    case "railway":
      return <Train className="size-3.5" />;
    case "render":
      return <Rocket className="size-3.5" />;
    case "cloudflare":
      return <Cloud className="size-3.5" />;
    default:
      return <ExternalLink className="size-3.5" />;
  }
}

function VercelMarkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M12 2L22 20H2L12 2Z" />
    </svg>
  );
}
