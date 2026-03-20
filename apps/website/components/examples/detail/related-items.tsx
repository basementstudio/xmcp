import { ExampleCard } from "@/components/examples/cards/cards";
import type { ExampleItem } from "@/app/examples/utils/github";

export function RelatedExamples({
  items,
}: {
  items: ExampleItem[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-brand-white">
        Other templates and examples
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <ExampleCard
            key={`${item.type}-${item.slug}`}
            {...item}
            href={`/examples/${item.slug}`}
            target="_self"
          />
        ))}
      </div>
    </div>
  );
}
