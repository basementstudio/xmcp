import { getIntegrationPages } from "@/lib/source";
import { ContentCard } from "@/components/ui/content-card";

export function IntegrationList() {
  return (
    <div className="site-card-grid not-prose">
      {getIntegrationPages().map((page) => (
        <ContentCard key={page.url} href={page.url}>
          <h2 className="site-card-title">{page.data.title}</h2>
          <p className="text-sm text-brand-neutral-100">
            {page.data.description}
          </p>
        </ContentCard>
      ))}
    </div>
  );
}
