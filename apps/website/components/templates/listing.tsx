"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { TemplateItem } from "@/app/templates/utils/content";
import { slugifyCategory } from "@/app/templates/utils/slug";
import { formatTag, tagClassName } from "@/components/ui/tag";
import { cn } from "@/utils/cn";
import type { CategoryCopy } from "@/app/templates/utils/category-copy";
import { TemplateCard } from "./card";

const ITEMS_PER_PAGE = 12;

interface TemplatesListingProps {
  templates: TemplateItem[];
  categories: string[];
  currentCategory: string | null;
  introduction?: CategoryCopy;
}

export function TemplatesListing({
  templates,
  categories,
  currentCategory,
  introduction,
}: TemplatesListingProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pageParam = Number(searchParams.get("page"));
  const currentPage =
    Number.isFinite(pageParam) && pageParam >= 1 ? pageParam : 1;

  const totalPages = Math.max(1, Math.ceil(templates.length / ITEMS_PER_PAGE));
  const effectivePage = Math.min(currentPage, totalPages);
  const pageItems = templates.slice(
    (effectivePage - 1) * ITEMS_PER_PAGE,
    effectivePage * ITEMS_PER_PAGE
  );

  const pageStart = templates.length
    ? (effectivePage - 1) * ITEMS_PER_PAGE + 1
    : 0;
  const pageEnd = templates.length
    ? Math.min(effectivePage * ITEMS_PER_PAGE, templates.length)
    : 0;

  const chipHref = (category: string) =>
    `/templates/category/${slugifyCategory(category)}`;
  const pageHref = (target: number) =>
    target <= 1 ? pathname : `${pathname}?page=${target}`;

  return (
    <div className="site-listing">
      <div className="listing-intro">
        <p className="eyebrow">The starting points / Templates</p>
        <div>
          <h1 className="display">
            {introduction?.title ?? "MCP server templates"}
          </h1>
          <p className="listing-description">
            {introduction?.description ??
              "Start a TypeScript MCP server with runnable templates for authentication, web frameworks, payments, and interactive apps."}
          </p>
          {introduction && (
            <>
              <p className="listing-description">
                {introduction.prerequisites}
              </p>
              <ul className="flex flex-wrap gap-4 text-sm">
                {introduction.links.map((link) => (
                  <li key={link.href}>
                    <Link className="underline" href={link.href}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="col-span-12 flex flex-col gap-8">
        <div className="flex flex-col gap-4 max-w-[920px] w-full mx-auto">
          <div className="flex flex-col items-start gap-2 min-w-0">
            <h2 className="text-sm font-medium text-brand-neutral-100 tracking-wide shrink-0">
              Filter by category
            </h2>

            <div className="relative min-w-0 max-w-full">
              <div className="edge-fade-x flex gap-2 scroll-smooth py-0.5">
                <Link
                  href="/templates"
                  className={cn(
                    "text-xs shrink-0",
                    tagClassName({
                      interactive: true,
                      selected: currentCategory === null,
                    })
                  )}
                >
                  All
                </Link>
                {categories.map((category) => {
                  const slug = slugifyCategory(category);
                  const isActive = currentCategory === slug;
                  return (
                    <Link
                      key={slug}
                      href={chipHref(category)}
                      className={cn(
                        "text-xs shrink-0",
                        tagClassName({ interactive: true, selected: isActive })
                      )}
                    >
                      {formatTag(category)}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="min-h-[60vh] flex flex-col gap-6">
          <section className="site-card-grid">
            {templates.length > 0 ? (
              pageItems.map((item, index) => (
                <TemplateCard
                  key={item.slug}
                  {...item}
                  loading={index < 3 ? "eager" : "lazy"}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-brand-neutral-200 text-sm">
                  No templates found in this category.
                </p>
              </div>
            )}
          </section>

          {templates.length > ITEMS_PER_PAGE && (
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <div className="justify-self-start">
                {effectivePage > 1 ? (
                  <Link
                    href={pageHref(effectivePage - 1)}
                    aria-label="Go to previous page"
                    scroll={false}
                    className="px-3 py-1.5 text-xs uppercase tracking-wide rounded-md border border-dashed transition-colors duration-200 border-brand-neutral-300 text-brand-neutral-100 hover:text-brand-white hover:border-solid hover:border-brand-neutral-300 hover:bg-brand-neutral-600"
                  >
                    Previous
                  </Link>
                ) : null}
              </div>

              <p
                aria-live="polite"
                className="text-xs text-brand-neutral-200 uppercase tracking-wide text-center"
              >
                <span className="block md:inline">
                  Page {effectivePage} of {totalPages}
                </span>
                <span className="hidden md:inline"> • </span>
                <span className="block md:inline">
                  Showing {pageStart}-{pageEnd} of {templates.length}
                </span>
              </p>

              <div className="justify-self-end">
                {effectivePage < totalPages ? (
                  <Link
                    href={pageHref(effectivePage + 1)}
                    aria-label="Go to next page"
                    scroll={false}
                    className="px-3 py-1.5 text-xs uppercase tracking-wide rounded-md border border-dashed transition-colors duration-200 border-brand-neutral-300 text-brand-neutral-100 hover:text-brand-white hover:border-solid hover:border-brand-neutral-300 hover:bg-brand-neutral-600"
                  >
                    Next
                  </Link>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
