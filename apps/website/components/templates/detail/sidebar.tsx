import Link from "next/link";
import type { ReactNode } from "react";
import type { TemplateItem } from "@/app/templates/utils/content";
import { slugifyCategory } from "@/app/templates/utils/slug";
import { TemplateShareActions } from "@/components/templates/share-actions";
import { Tag } from "@/components/ui/tag";

export function TemplateDetailSidebar({
  template,
  repositoryLabel,
  categoryItems,
  validCategorySlugs,
  pageUrl,
  xShareUrl,
}: {
  template: TemplateItem;
  repositoryLabel: string;
  categoryItems: string[];
  validCategorySlugs: Set<string>;
  pageUrl: string;
  xShareUrl: string;
}) {
  return (
    <dl className="template-details">
      <InfoCard label="Repository">
        <Link
          href={template.repositoryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-neutral-50 link-underline hover:text-brand-white"
        >
          {repositoryLabel}
        </Link>
      </InfoCard>

      {(template.demoUrl || template.websiteUrl) && (
        <InfoCard label="Website">
          <Link
            href={template.demoUrl || template.websiteUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-brand-white text-brand-neutral-50 link-underline"
          >
            {template.demoUrl || template.websiteUrl}
          </Link>
        </InfoCard>
      )}

      {template.replitUrl && (
        <InfoCard label="Replit">
          <Link
            href={template.replitUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-neutral-50 link-underline hover:text-brand-white"
          >
            {template.replitUrl}
          </Link>
        </InfoCard>
      )}

      {categoryItems.length > 0 && (
        <InfoCard label="Categories">
          <div className="flex flex-wrap gap-2">
            {categoryItems.map((tag) => {
              const slug = slugifyCategory(tag);
              const isValid = validCategorySlugs.has(slug);
              return (
                <Tag
                  key={tag}
                  text={tag}
                  href={isValid ? `/templates/category/${slug}` : undefined}
                  interactive={isValid}
                  className="bg-brand-neutral-600"
                />
              );
            })}
          </div>
        </InfoCard>
      )}

      <InfoCard label="Share">
        <TemplateShareActions
          pageUrl={pageUrl}
          repositoryUrl={template.repositoryUrl}
          xShareUrl={xShareUrl}
        />
      </InfoCard>
    </dl>
  );
}

function InfoCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="template-details-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
