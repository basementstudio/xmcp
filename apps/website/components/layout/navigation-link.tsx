import { ContentCard } from "@/components/ui/content-card";
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
    <ContentCard
      href={item.url}
      rel={isPrevious ? "prev" : "next"}
      className={!isPrevious ? "text-right" : undefined}
    >
      <span className="site-card-description">{label}</span>
      <span className="site-card-title">{item.name}</span>
    </ContentCard>
  );
}
