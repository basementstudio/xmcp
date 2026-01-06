import Link from "next/link";
import { cn } from "@/lib/cn";
import type * as PageTree from "fumadocs-core/page-tree";

export function NavigationLink({
  item,
  direction,
}: {
  item: PageTree.Item;
  direction: "previous" | "next";
}) {
  const isPrevious = direction === "previous";
  const label = isPrevious ? "Previous" : "Next";

  return (
    <Link
      href={item.url}
      className={cn(
        "flex flex-col gap-2 p-4 border border-brand-neutral-400 hover:border-brand-neutral-200 transition-colors group flex-1 rounded-xs",
        !isPrevious && "items-end text-right"
      )}
    >
      <span className="text-sm text-brand-neutral-100 flex items-center gap-2">
        {label}
      </span>
      <span className="text-brand-white font-medium group-hover:text-fd-primary transition-colors">
        {item.name}
      </span>
    </Link>
  );
}
