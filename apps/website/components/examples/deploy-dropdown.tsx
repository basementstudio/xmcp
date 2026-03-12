"use client";

import Image from "next/image";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { Cloud, ExternalLink, Layers, Rocket, Train } from "lucide-react";
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
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size="sm"
          className="group h-10 md:h-8 w-auto md:w-[90px] min-w-0 rounded-[2px] pl-3.5 md:pl-3 pr-2.5 md:pr-2 pt-1.5 pb-1.5 gap-2 text-[15px] leading-5 md:text-sm"
        >
          <span>Deploy</span>
          <ArrowDownIcon className="h-[5px] w-[10px] transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="!bg-brand-neutral-600 opacity-100 border border-brand-neutral-400 text-brand-neutral-50 p-1 w-[var(--radix-dropdown-menu-trigger-width)] min-w-0 shadow-lg backdrop-blur-none overflow-hidden [&_*:focus-visible]:outline-none [&_*:focus-visible]:ring-0 [&_*:focus-visible]:outline-offset-0"
      >
        {options.map((option) => (
          <DropdownMenuItem
            key={`${option.provider}-${option.href}`}
            asChild
            className="outline-none border-0 ring-0 shadow-none data-[highlighted]:outline-none data-[highlighted]:border-0 data-[highlighted]:ring-0 data-[highlighted]:shadow-none data-[highlighted]:bg-brand-neutral-500"
          >
            <Link
              href={option.href}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-sm cursor-pointer px-2 py-1.5 text-brand-neutral-100 hover:bg-brand-neutral-500 hover:text-brand-white data-[highlighted]:bg-brand-neutral-500 data-[highlighted]:text-brand-white focus:outline-none focus:ring-0 focus:shadow-none border-0 outline-none ring-0 shadow-none transition-colors duration-200 inline-flex items-center gap-2"
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

function ArrowDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="10"
      height="5"
      viewBox="0 0 10 5"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M5 5L0 0H10L5 5Z" fill="currentColor" />
    </svg>
  );
}

function ProviderIcon({ provider }: { provider: DeployProvider }) {
  switch (provider) {
    case "vercel":
      return <VercelMarkIcon className="size-3.5" />;
    case "alpic":
      return <AlpicMarkIcon className="size-3.5" />;
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

function AlpicMarkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <Image
      src="/examples/alpic.png"
      alt="Alpic"
      width={14}
      height={14}
      className={props.className}
    />
  );
}
