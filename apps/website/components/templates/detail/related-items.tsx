import { TemplateCard } from "@/components/templates/card";
import type { TemplateItem } from "@/app/templates/utils/github";

export function RelatedTemplates({ items }: { items: TemplateItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-brand-white">Other templates</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
