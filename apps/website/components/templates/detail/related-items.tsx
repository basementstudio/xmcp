import { TemplateCard } from "@/components/templates/card";
import type { TemplateItem } from "@/app/templates/utils/content";

export function RelatedTemplates({ items }: { items: TemplateItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="site-section-title">Other templates</h2>
      <div className="site-card-grid">
        {items.map((item) => (
          <TemplateCard
            key={item.slug}
            {...item}
            href={`/templates/${item.slug}`}
            target="_self"
          />
        ))}
      </div>
    </div>
  );
}
