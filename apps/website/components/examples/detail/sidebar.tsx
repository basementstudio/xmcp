import Link from "next/link";
import type { ReactNode } from "react";
import type { ExampleItem } from "@/app/examples/utils/github";
import { ExampleShareActions } from "@/components/examples/share-actions";
import { Tag } from "@/components/ui/tag";

export function ExampleDetailSidebar({
  example,
  repositoryLabel,
  categoryItems,
  pageUrl,
  xShareUrl,
}: {
  example: ExampleItem;
  repositoryLabel: string;
  categoryItems: string[];
  pageUrl: string;
  xShareUrl: string;
}) {
  return (
    <aside className="lg:col-span-3 space-y-8">
      <InfoCard label="GitHub Repo">
        <Link
          href={example.repositoryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-neutral-50 underline underline-offset-2 hover:text-brand-white"
        >
          {repositoryLabel}
        </Link>
      </InfoCard>

      {(example.demoUrl || example.websiteUrl) && (
        <InfoCard label="Website link">
          <Link
            href={example.demoUrl || example.websiteUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-brand-white text-brand-neutral-50 underline underline-offset-2"
          >
            {example.demoUrl || example.websiteUrl}
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
                href={`/examples?category=${encodeURIComponent(tag)}`}
                interactive
                className="bg-brand-neutral-600"
              />
            ))}
          </div>
        </InfoCard>
      )}

      <InfoCard label="Share">
        <ExampleShareActions
          pageUrl={pageUrl}
          repositoryUrl={example.repositoryUrl}
          xShareUrl={xShareUrl}
        />
      </InfoCard>
    </aside>
  );
}

function InfoCard({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs tracking-wide text-brand-neutral-100">{label}</p>
      <div className="text-sm text-brand-white leading-relaxed">{children}</div>
    </div>
  );
}
