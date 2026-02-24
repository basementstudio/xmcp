"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { cn } from "../../../utils/cn";
import Link from "next/link";
import { ExampleItem, BRANCH } from "@/app/examples/utils/github";
import { Tag } from "@/components/ui/tag";
<<<<<<< Updated upstream
import { Icons as UiIcons } from "@/components/ui/icons";
=======
import Image from "next/image";
import Shadow from "./shadow.png";

>>>>>>> Stashed changes
interface ExampleCardsProps {
  examples: ExampleItem[];
  searchTerm: string;
}

export function ExampleCards({ examples, searchTerm }: ExampleCardsProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim().toLowerCase());
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  const updateScrollState = useCallback(() => {
    const container = categoryScrollRef.current;
    if (!container) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    setCanScrollLeft(container.scrollLeft > 1);
    setCanScrollRight(
      container.scrollLeft + container.clientWidth < container.scrollWidth - 1
    );
  }, []);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    examples.forEach((example) => {
      if (example.category) {
        tagSet.add(example.category);
      }
      if (example.tags) {
        example.tags.forEach((tag) => tagSet.add(tag));
      }
    });
    return ["All", ...Array.from(tagSet).sort()];
  }, [examples]);

  const filteredExamples = useMemo(() => {
    return examples.filter((example) => {
      const matchesSearch =
        debouncedSearchTerm.length === 0 ||
        [
          example.name,
          example.description,
          ...(example.tags ?? []),
        ].some((value) => value.toLowerCase().includes(debouncedSearchTerm));

      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.includes("All") ||
        selectedTags.some((selectedTag) =>
          (example.tags ?? []).includes(selectedTag)
        );

      return matchesSearch && matchesTags;
    });
  }, [debouncedSearchTerm, examples, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      if (tag === "All") {
        return [];
      }

      let newTags;
      if (prev.length === 0) {
        newTags = [tag];
      } else {
        newTags = prev.includes(tag)
          ? prev.filter((t) => t !== tag)
          : [...prev, tag];
      }

      const nonAllTags = allTags.filter((t) => t !== "All");
      const allNonAllTagsSelected = nonAllTags.every((t) =>
        newTags.includes(t)
      );

      if (allNonAllTagsSelected && nonAllTags.length > 0) {
        return [];
      }

      return newTags;
    });
  };

  const clearFilters = () => {
    setSelectedTags([]);
  };

  const scrollCategories = (direction: "left" | "right") => {
    const container = categoryScrollRef.current;
    if (!container) return;

    const amount = Math.max(container.clientWidth * 0.6, 160);
    container.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    updateScrollState();

    const container = categoryScrollRef.current;
    if (!container) return;

    const handleScroll = () => updateScrollState();
    container.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [allTags.length, updateScrollState]);

  return (
    <div className="col-span-12 flex flex-col gap-8">
      <div className="flex flex-col gap-4">
<<<<<<< Updated upstream
        <div className="flex items-center gap-4 min-w-0">
          <h3 className="text-sm font-medium text-brand-white tracking-wide shrink-0">
            Filter by category
=======
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-brand-white uppercase tracking-wide">
            Filter by Tags
>>>>>>> Stashed changes
          </h3>

          <div className="group flex items-center gap-1 flex-1 min-w-0">
            <button
              type="button"
              aria-label="Scroll categories left"
              onClick={() => scrollCategories("left")}
              className={cn(
                "size-8 shrink-0 grid place-items-center text-brand-white/80 hover:text-brand-white transition-opacity duration-200",
                canScrollLeft
                  ? "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto"
                  : "opacity-0 pointer-events-none"
              )}
              >
              <UiIcons.arrowLeft className="size-4" />
            </button>

            <div className="relative flex-1 min-w-0">
              <div
                ref={categoryScrollRef}
                className="flex-1 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              >
                <div className="flex min-w-max gap-2 py-0.5 pr-2">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        "text-xs px-3 py-1.5 border border-dashed transition-colors duration-200 uppercase tracking-wide cursor-pointer shrink-0",
                        (
                          tag === "All"
                            ? selectedTags.length === 0
                            : selectedTags.includes(tag)
                        )
                          ? "border-brand-white bg-brand-neutral-600 text-brand-white"
                          : "border-brand-neutral-400 text-brand-white hover:border-brand-neutral-300 hover:bg-brand-neutral-600"
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div
                className={cn(
                  "pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-brand-black to-transparent transition-opacity duration-200",
                  canScrollLeft ? "opacity-100" : "opacity-0"
                )}
              />
              <div
                className={cn(
                  "pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-brand-black to-transparent transition-opacity duration-200",
                  canScrollRight ? "opacity-100" : "opacity-0"
                )}
              />
            </div>

            <button
              type="button"
              aria-label="Scroll categories right"
              onClick={() => scrollCategories("right")}
              className={cn(
                "size-8 shrink-0 grid place-items-center text-brand-white/80 hover:text-brand-white transition-opacity duration-200",
                canScrollRight
                  ? "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto"
                  : "opacity-0 pointer-events-none"
              )}
              >
              <UiIcons.arrowLeft className="size-4 rotate-180" />
            </button>
          </div>

          {selectedTags.length > 0 && (
            <button
              onClick={clearFilters}
              className="text-xs text-brand-neutral-200 hover:text-white transition-colors shrink-0"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="min-h-[60vh]">
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExamples.length > 0 ? (
            filteredExamples.map((example: ExampleItem, index: number) => (
              <ExampleCard
                key={example.slug || example.name || index}
                {...example}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-brand-neutral-200 text-sm">
                No examples or templates found for the current search and
                filters.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export function ExampleCard({
  className,
  href,
  ctaLabel,
  target,
  ...item
}: {
  className?: string;
  href?: string;
  ctaLabel?: string;
  target?: string;
} & ExampleItem) {
<<<<<<< Updated upstream
  const { name, description, repositoryUrl, tags, kind } = item;
=======
  const { name, description, repositoryUrl, category, preview, previewUrl } =
    item;
  const slug = item.slug;
  const resolvedPreview =
    previewUrl ||
    (preview
      ? `https://raw.githubusercontent.com/xmcp-dev/templates/${BRANCH}/${preview}`
      : undefined);
  const linkHref = href ?? (slug ? `/examples/${slug}` : repositoryUrl);
  const defaultsToExternal = href
    ? linkHref.startsWith("http://") || linkHref.startsWith("https://")
    : !slug; // fall back to repo when no slug
  const linkTarget = target ?? (defaultsToExternal ? "_blank" : undefined);
  const isExternal = linkTarget === "_blank";
>>>>>>> Stashed changes

  return (
    <Link
      href={linkHref}
      target={linkTarget}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={cn(
        "text-left group relative overflow-hidden h-full min-w-[280px] block",
        isExternal ? "cursor-alias" : "cursor-pointer",
        className
      )}
    >
<<<<<<< Updated upstream
      <div className="relative border p-4 group-hover:bg-black h-full min-h-[12rem] w-full flex flex-col border-brand-neutral-500 group-hover:border-brand-neutral-300 transition-colors duration-200">
        <div className="mb-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-brand-white font-medium mt-0 uppercase">
              {name}
            </h4>
            <span className="text-[10px] border border-brand-neutral-300 text-brand-neutral-100 px-1.5 py-0.5 uppercase tracking-wide">
              {kind}
            </span>
          </div>
=======
      <div className="relative border group-hover:bg-black h-full min-h-72 w-full flex flex-col border-brand-neutral-500 group-hover:border-brand-neutral-300 transition-colors duration-200 overflow-hidden gap-1">
        <div className="p-4 pb-0 flex flex-col gap-2 relative z-10">
          <h4 className="text-brand-white font-medium mt-0 text-[1.125rem]">
            {name}
          </h4>
>>>>>>> Stashed changes
        </div>

        <div className="flex-1 flex flex-col justify-between relative z-10">
          <div className="space-y-3 flex flex-col justify-between h-full px-4">
            <p className="text-sm text-brand-neutral-100 leading-relaxed">
              {description}
            </p>
          </div>

          {(category || ctaLabel) && (
            <div className="flex items-center justify-between mt-4 px-4 pb-4 gap-3">
              {category && <Tag text={category} />}
              {ctaLabel && (
                <span className="text-[0.625rem] uppercase tracking-wide border border-brand-neutral-400 px-2 py-1 text-brand-neutral-50">
                  {ctaLabel}
                </span>
              )}
            </div>
          )}
        </div>

        {resolvedPreview && (
          <div
            className="absolute inset-0 translate-y-[60%] opacity-50 translate-x-[10%]"
            style={{
              perspective: "550px",
              perspectiveOrigin: "30% 55%",
            }}
          >
            <Image
              src={resolvedPreview}
              alt={`${name} preview`}
              fill
              sizes="50vw"
              className="object-cover scale-110 border-2 rounded-md border-brand-neutral-400/70 bg-brand-neutral-900"
              priority={false}
              style={{
                background:
                  "radial-gradient(50% 100% at 50% 100%, #000000 0%, rgba(217, 217, 217, 0) 100%)",
                transform: "skew(-34deg, 18deg) rotateX(10deg) rotateY(-10deg)",
                transformStyle: "preserve-3d",
              }}
            />
            <Image
              src={Shadow}
              alt=""
              aria-hidden
              fill
              sizes="50vw"
              className="object-cover scale-200 pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity duration-200 -translate-x-[10%] -translate-y-[45%] -rotate-12"
              priority={false}
              style={{
                transform: "skew(-34deg, 18deg) rotateX(10deg) rotateY(-10deg)",
                transformStyle: "preserve-3d",
              }}
            />
          </div>
        )}
      </div>
    </Link>
  );
}
