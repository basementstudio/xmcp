import Link from "next/link";
import type { ReactNode } from "react";
import type { TemplateItem } from "@/app/templates/utils/github";
import { slugifyCategory } from "@/app/templates/utils/slug";
import { TemplateShareActions } from "@/components/templates/share-actions";
import { Tag } from "@/components/ui/tag";

export function TemplateDetailSidebar({
  template,
  repositoryLabel,
  categoryItems,
  pageUrl,
  xShareUrl,
}: {
  template: TemplateItem;
  repositoryLabel: string;
  categoryItems: string[];
  pageUrl: string;
  xShareUrl: string;
}) {
  return (
    <aside className="lg:col-span-3 space-y-8">
      <InfoCard label="GitHub Repo">
        <Link
          href={template.repositoryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-neutral-50 underline underline-offset-2 hover:text-brand-white"
        >
          {repositoryLabel}
        </Link>
      </InfoCard>

      {(template.demoUrl || template.websiteUrl) && (
        <InfoCard label="Website link">
          <Link
            href={template.demoUrl || template.websiteUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-brand-white text-brand-neutral-50 underline underline-offset-2"
          >
            {template.demoUrl || template.websiteUrl}
          </Link>
        </InfoCard>
      )}

      {template.replitUrl && (
        <InfoCard label="Remix on Replit">
          <Link
            href={template.replitUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-neutral-50 underline underline-offset-2 hover:text-brand-white"
          >
            {template.replitUrl}
          </Link>
        </InfoCard>
      )}

      {categoryItems.length > 0 && (
        <InfoCard label="Categories">
          <div className="flex flex-wrap gap-2">
            {categoryItems.map((tag) => (
              <Tag
                key={tag}
                text={tag}
                href={`/templates/category/${slugifyCategory(tag)}`}
                interactive
                className="bg-brand-neutral-600"
              />
            ))}
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
    </aside>
  );
}

function InfoCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs tracking-wide text-brand-neutral-100">{label}</p>
      <div className="text-sm text-brand-white leading-relaxed">{children}</div>
    </div>
  );
}
