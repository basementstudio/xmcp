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
import type { VariantProps } from "class-variance-authority";
import { Button, buttonVariants } from "@/components/ui/button";

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
        className="z-50 !bg-brand-neutral-600 opacity-100 border border-brand-neutral-400 text-brand-neutral-50 p-1 w-[var(--radix-dropdown-menu-trigger-width)] min-w-0 shadow-lg backdrop-blur-none overflow-hidden [&_*:focus-visible]:outline-none [&_*:focus-visible]:ring-0 [&_*:focus-visible]:outline-offset-0"
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
    case "replit":
      return <ReplitMarkIcon className="size-3.5" />;
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

function AlpicMarkIcon({ className }: { className?: string }) {
  return (
    <Image
      src="/examples/alpic.png"
      alt="Alpic"
      width={14}
      height={14}
      className={className}
    />
  );
}

function ReplitMarkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 22 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M10.79 7.72365C10.79 7.85696 10.79 7.92361 10.7947 7.99122C10.8234 8.40818 11.0001 8.83473 11.2746 9.14987C11.3191 9.20098 11.3596 9.24141 11.4404 9.32227C11.8007 9.68251 12.2925 9.87793 12.802 9.87793H18.3224C19.4258 9.87793 19.9775 9.87793 20.3989 10.0927C20.7696 10.2815 21.071 10.5829 21.2599 10.9536C21.4746 11.3751 21.4746 11.9267 21.4746 13.0301V16.3635C21.4746 17.4668 21.4746 18.0185 21.2599 18.4399C21.071 18.8106 20.7696 19.112 20.3989 19.3009C19.9775 19.5156 19.4258 19.5156 18.3224 19.5156H12.7888C12.2847 19.5156 11.7979 19.709 11.4414 20.0654C11.3597 20.1471 11.3189 20.1879 11.2742 20.2393C11.0001 20.5542 10.8236 20.9803 10.7947 21.3968C10.79 21.4647 10.79 21.5314 10.79 21.6647V26.2599C10.79 27.3633 10.79 27.915 10.5753 28.3364C10.3864 28.7071 10.085 29.0085 9.71434 29.1974C9.29291 29.4121 8.74123 29.4121 7.63787 29.4121H3.15217C2.04881 29.4121 1.49713 29.4121 1.0757 29.1974C0.704998 29.0085 0.40361 28.7071 0.214729 28.3364C0 27.915 0 27.3633 0 26.2599V22.6981C0 21.5947 0 21.043 0.214729 20.6216C0.40361 20.2509 0.704998 19.9495 1.0757 19.7606C1.49713 19.5459 2.04881 19.5459 3.15217 19.5459H8.70118C8.72901 19.5459 8.74293 19.5459 8.75893 19.5456C9.24848 19.5377 9.74539 19.3319 10.0972 18.9913C10.1087 18.9802 10.1138 18.9751 10.124 18.9648C10.2195 18.8694 10.2672 18.8217 10.317 18.7635C10.5817 18.454 10.7525 18.0418 10.7841 17.6357C10.79 17.5594 10.79 17.4835 10.79 17.3319V12.0565C10.79 11.9048 10.79 11.829 10.784 11.7522C10.7523 11.3467 10.5818 10.9349 10.3174 10.6257C10.2674 10.5672 10.2193 10.5191 10.123 10.4229C9.76256 10.0624 9.27061 9.86621 8.76081 9.86621H3.15217C2.04881 9.86621 1.49713 9.86621 1.0757 9.65148C0.704998 9.4626 0.40361 9.16121 0.214729 8.79051C0 8.36908 0 7.8174 0 6.71404V3.15217C0 2.04881 0 1.49713 0.214729 1.0757C0.40361 0.704998 0.704998 0.40361 1.0757 0.214729C1.49713 0 2.04881 0 3.15217 0H7.63787C8.74123 0 9.29291 0 9.71434 0.214729C10.085 0.40361 10.3864 0.704998 10.5753 1.0757C10.79 1.49713 10.79 2.04881 10.79 3.15217V7.72365Z" fill="#FF3C00" />
    </svg>
  );
}
