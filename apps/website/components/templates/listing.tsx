"use client";

import { useMemo, useState, useDeferredValue } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { TemplateItem } from "@/app/templates/utils/content";
import { slugifyCategory } from "@/app/templates/utils/slug";
import { tagClassName } from "@/components/ui/tag";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/icons";
import { cn } from "@/utils/cn";
import { TemplateCard } from "./card";

const ITEMS_PER_PAGE = 12;

interface TemplatesListingProps {
  templates: TemplateItem[];
  categories: string[];
  currentCategory: string | null;
}

export function TemplatesListing({
  templates,
  categories,
  currentCategory,
}: TemplatesListingProps) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pageParam = Number(searchParams.get("page"));
  const currentPage =
    Number.isFinite(pageParam) && pageParam >= 1 ? pageParam : 1;

  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (normalizedQuery.length === 0) return templates;
    return templates.filter((item) => {
      const haystack = [
        item.name,
        item.description,
        item.category ?? "",
        ...(item.tags ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [templates, normalizedQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const effectivePage = Math.min(currentPage, totalPages);
  const pageItems = filtered.slice(
    (effectivePage - 1) * ITEMS_PER_PAGE,
    effectivePage * ITEMS_PER_PAGE
  );

  const pageStart = filtered.length
    ? (effectivePage - 1) * ITEMS_PER_PAGE + 1
    : 0;
  const pageEnd = filtered.length
    ? Math.min(effectivePage * ITEMS_PER_PAGE, filtered.length)
    : 0;

  const chipHref = (category: string) =>
    `/templates/category/${slugifyCategory(category)}`;
  const pageHref = (target: number) =>
    target <= 1 ? pathname : `${pathname}?page=${target}`;

  return (
    <div className="col-span-12 grid grid-cols-12 gap-[20px] py-8 md:py-16">
      <div className="listing-intro">
        <p className="eyebrow">The starting points / Templates</p>
        <div>
          <h1 className="display">Templates</h1>
          <p className="listing-description">
            Quickstart guides and templates to get you started with xmcp with
            real-world implementations and best practices.
          </p>
          <label htmlFor="templates-search" className="sr-only">
            Search
          </label>
          <div className="relative mt-7 w-full max-w-[520px]">
            <Icons.search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-neutral-300" />
            <Input
              id="templates-search"
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search templates"
              className="h-auto rounded-md border-brand-neutral-400 bg-brand-black p-2 pl-10 text-sm text-brand-neutral-200 shadow-none placeholder:text-brand-neutral-200 transition-colors duration-200 ease-in-out hover:bg-white/10 focus-visible:ring-0"
            />
          </div>
        </div>
      </div>

      <div className="col-span-12 flex flex-col gap-8">
        <div className="flex flex-col gap-4 max-w-[920px] w-full mx-auto">
          <div className="flex flex-col items-center gap-2 min-w-0 md:flex-row md:justify-center md:gap-4">
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
                      {category}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="min-h-[60vh] flex flex-col gap-6">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.length > 0 ? (
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
                  No templates found for the current search and filters.
                </p>
              </div>
            )}
          </section>

          {filtered.length > ITEMS_PER_PAGE && (
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
                  Showing {pageStart}-{pageEnd} of {filtered.length}
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
