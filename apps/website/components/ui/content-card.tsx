import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ContentCardProps = Omit<ComponentProps<typeof Link>, "media"> & {
  media?: ReactNode;
  horizontal?: boolean;
};

export function ContentCard({
  media,
  horizontal = false,
  className,
  children,
  ...props
}: ContentCardProps) {
  const hasMedia = media !== undefined && media !== null;
  return (
    <Link
      {...props}
      className={cn(
        "site-content-card group relative block h-full min-w-0 rounded-xl text-left",
        className
      )}
    >
      <article
        className={cn(
          "site-card-surface relative flex h-full w-full flex-col overflow-hidden",
          hasMedia && "min-h-[16rem]",
          horizontal && "md:flex-row"
        )}
      >
        {hasMedia && (
          <div
            className={cn(
              "site-card-media relative flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden border-b border-brand-neutral-500 group-hover:border-brand-neutral-300 group-focus-visible:border-brand-neutral-300",
              horizontal && "md:w-1/2 md:border-b-0 md:border-r"
            )}
          >
            {media}
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">{children}</div>
      </article>
    </Link>
  );
}
