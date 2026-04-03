"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { cn } from "../../../utils/cn";
import Link from "next/link";
import type { ExampleItem } from "@/app/examples/utils/github";
import { Tag, tagClassName } from "@/components/ui/tag";
import { Icons as UiIcons } from "@/components/ui/icons";
import Image from "next/image";
import { resolveExamplePreviewImage } from "@/lib/example-preview-image";
import Shadow from "./shadow.png";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
interface ExampleCardsProps {
  examples: ExampleItem[];
  searchTerm: string;
  initialCategoryFilter?: string;
}

const ITEMS_PER_PAGE = 12;

function getFallbackImageClass(src: string) {
  switch (src) {
    case "/examples/auth0.svg":
      return "bottom-6 left-[54%] -translate-x-1/2 w-[60%]";
    case "/examples/clerk.svg":
      return "bottom-8 left-[52%] -translate-x-1/2 w-[68%]";
    case "/examples/nestjs.svg":
      return "bottom-8 left-[54%] -translate-x-1/2 w-[74%]";
    case "/examples/workos.svg":
      return "bottom-8 left-[56%] -translate-x-1/2 w-[72%]";
    case "/examples/cloudflare.svg":
      return "bottom-4 left-[59%] -translate-x-1/2 w-[86%]";
    case "/examples/express.svg":
      return "bottom-4 left-[54%] -translate-x-1/2 w-[84%]";
    case "/examples/betterauth.svg":
      return "bottom-4 left-[55%] -translate-x-1/2 w-[76%]";
    case "/examples/polar.svg":
      return "bottom-2 left-[55%] -translate-x-1/2 w-[88%]";
    case "/examples/react.svg":
      return "bottom-0 left-[56%] -translate-x-1/2 w-[96%]";
    case "/examples/tailwind.svg":
      return "bottom-0 left-[54%] -translate-x-1/2 w-full";
    default:
      return "-bottom-7 left-0 w-full";
  }
}

export function ExampleCards({
  examples,
  searchTerm,
  initialCategoryFilter,
}: ExampleCardsProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
      tagSet.add(example.primaryFilterTag ?? example.category ?? example.type);
    });
    return ["All", ...Array.from(tagSet).sort()];
  }, [examples]);

  const urlCategories = useMemo(() => {
    const rawUrlCategories = searchParams.getAll("category");
    return rawUrlCategories.length > 0
      ? rawUrlCategories
      : initialCategoryFilter
        ? initialCategoryFilter
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean)
        : [];
  }, [searchParams, initialCategoryFilter]);

  useEffect(() => {
    if (urlCategories.length === 0) {
      setSelectedTags([]);
      return;
    }

    const normalizedCategories = new Set(
      urlCategories.map((value) => value.trim().toLowerCase())
    );
    const matchedTags = allTags.filter(
      (tag) => tag !== "All" && normalizedCategories.has(tag.toLowerCase())
    );

    setSelectedTags((current) => {
      if (
        current.length === matchedTags.length &&
        current.every((tag, index) => tag === matchedTags[index])
      ) {
        return current;
      }
      return matchedTags;
    });
  }, [allTags, urlCategories]);

  const filteredExamples = useMemo(() => {
    return examples.filter((example) => {
      const matchesSearch =
        debouncedSearchTerm.length === 0 ||
        [example.name, example.description, ...(example.tags ?? [])].some(
          (value) => value.toLowerCase().includes(debouncedSearchTerm)
        );

      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.some(
          (selectedTag) =>
            (example.tags ?? []).includes(selectedTag) ||
            example.category === selectedTag ||
            example.type === selectedTag
        );

      return matchesSearch && matchesTags;
    });
  }, [debouncedSearchTerm, examples, selectedTags]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredExamples.length / ITEMS_PER_PAGE)),
    [filteredExamples.length]
  );

  const paginatedExamples = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredExamples.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredExamples]);

  const pageStart = filteredExamples.length
    ? (currentPage - 1) * ITEMS_PER_PAGE + 1
    : 0;
  const pageEnd = filteredExamples.length
    ? Math.min(currentPage * ITEMS_PER_PAGE, filteredExamples.length)
    : 0;

  const toggleTag = (tag: string) => {
    const nextTags =
      tag === "All"
        ? []
        : selectedTags.includes(tag)
          ? selectedTags.filter((selectedTag) => selectedTag !== tag)
          : [...selectedTags, tag];
    setSelectedTags(nextTags);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    nextTags.forEach((nextTag) => params.append("category", nextTag));

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
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

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, selectedTags]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="col-span-12 flex flex-col gap-8">
      <div className="flex flex-col gap-4 max-w-[920px] w-full mx-auto">
        <div className="flex flex-col items-start gap-2 min-w-0 md:flex-row md:items-center md:gap-4">
          <h3 className="text-sm font-medium text-brand-neutral-100 tracking-wide shrink-0">
            Filter by category
          </h3>

          <div className="group flex items-center gap-1 w-full flex-1 min-w-0">
            <button
              type="button"
              aria-label="Scroll categories left"
              onClick={() => scrollCategories("left")}
              className={cn(
                "hidden md:grid size-8 shrink-0 place-items-center text-brand-white/80 hover:text-brand-white transition-opacity duration-200",
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
                      type="button"
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        "text-xs cursor-pointer shrink-0",
                        (
                          tag === "All"
                            ? selectedTags.length === 0
                            : selectedTags.includes(tag)
                        )
                          ? tagClassName({ interactive: true, selected: true })
                          : tagClassName({ interactive: true, selected: false })
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
                "hidden md:grid size-8 shrink-0 place-items-center text-brand-white/80 hover:text-brand-white transition-opacity duration-200",
                canScrollRight
                  ? "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto"
                  : "opacity-0 pointer-events-none"
              )}
            >
              <UiIcons.arrowLeft className="size-4 rotate-180" />
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-[60vh] flex flex-col gap-6">
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExamples.length > 0 ? (
            paginatedExamples.map((example: ExampleItem) => (
              <ExampleCard
                key={`${example.type}-${example.slug}`}
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

        {filteredExamples.length > ITEMS_PER_PAGE && (
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="justify-self-start">
              {currentPage > 1 && (
                <button
                  type="button"
                  aria-label="Go to previous page"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  className="px-3 py-1.5 text-xs uppercase tracking-wide border border-dashed transition-colors duration-200 border-brand-neutral-300 text-brand-neutral-100 hover:text-brand-white hover:border-solid hover:border-brand-neutral-300 hover:bg-brand-neutral-600 cursor-pointer"
                >
                  Previous
                </button>
              )}
            </div>

            <p
              aria-live="polite"
              className="text-xs text-brand-neutral-200 uppercase tracking-wide text-center"
            >
              <span className="block md:inline">
                Page {currentPage} of {totalPages}
              </span>
              <span className="hidden md:inline"> • </span>
              <span className="block md:inline">
                Showing {pageStart}-{pageEnd} of {filteredExamples.length}
              </span>
            </p>

            <div className="justify-self-end">
              {currentPage < totalPages && (
                <button
                  type="button"
                  aria-label="Go to next page"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  className="px-3 py-1.5 text-xs uppercase tracking-wide border border-dashed transition-colors duration-200 border-brand-neutral-300 text-brand-neutral-100 hover:text-brand-white hover:border-solid hover:border-brand-neutral-300 hover:bg-brand-neutral-600 cursor-pointer"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}
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
  const { name, description } = item;
  const displayName = name.replace(/-/g, " ").replace(/\s+/g, " ").trim();
  const isGenericLabel = (value?: string) => {
    if (!value) return true;
    const normalized = value.trim().toLowerCase();
    return (
      normalized.length === 0 ||
      normalized === "example" ||
      normalized === "examples" ||
      normalized === "template" ||
      normalized === "templates" ||
      normalized === item.type
    );
  };
  const previewImage = resolveExamplePreviewImage(item);
  const category =
    (!isGenericLabel(item.category) ? item.category : undefined) ??
    item.tags?.find((tag) => !isGenericLabel(tag)) ??
    item.category ??
    item.type;
  const linkHref = href ?? `/examples/${item.slug}`;
  const defaultsToExternal =
    linkHref.startsWith("http://") || linkHref.startsWith("https://");
  const linkTarget = target ?? (defaultsToExternal ? "_blank" : undefined);
  const isExternal = linkTarget === "_blank";

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
      <div className="relative border group-hover:bg-black h-full min-h-72 w-full flex flex-col border-brand-neutral-500 group-hover:border-brand-neutral-300 transition-colors duration-200 overflow-hidden gap-1">
        <div className="p-4 pb-0 flex flex-col gap-2 relative z-10">
          <h4 className="text-brand-white font-medium mt-0 text-[1.125rem] capitalize">
            {displayName}
          </h4>
        </div>

        <div className="flex-1 flex flex-col justify-between relative z-10">
          <div className="space-y-3 flex flex-col justify-between h-full px-4">
            <p className="text-sm text-brand-neutral-100 leading-relaxed capitalize">
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

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 overflow-hidden opacity-60 group-hover:opacity-75 transition-opacity duration-200">
            <div className="absolute inset-0 overflow-hidden">
              <Image
                src={previewImage.src}
                alt={`${displayName} preview`}
                width={1200}
                height={630}
                sizes="(max-width: 768px) 100vw, 33vw"
                unoptimized
                className={cn(
                  "absolute opacity-70 [mask-image:linear-gradient(to_top,black_0%,black_62%,transparent_100%)]",
                  previewImage.isFallback && previewImage.isNextJsFallback
                    ? "bottom-7 left-1/2 -translate-x-1/2 w-[78%]"
                    : previewImage.isFallback
                      ? getFallbackImageClass(previewImage.src)
                      : "-bottom-7 left-0 w-full"
                )}
                priority={false}
              />
            </div>
            <Image
              src="/textures/text5.png"
              alt=""
              aria-hidden
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="absolute inset-0 h-full w-full object-cover [transform:scaleX(-1)] mix-blend-screen opacity-10 group-hover:opacity-55 transition-opacity duration-300"
              priority={false}
            />
            <Image
              src={Shadow}
              alt=""
              aria-hidden
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="absolute inset-x-0 bottom-0 h-[140px] object-cover opacity-10 group-hover:opacity-15 transition-opacity duration-200"
              priority={false}
            />
          </div>
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-100 transition-opacity duration-300 group-hover:opacity-66 [box-shadow:inset_0_38px_58px_rgba(0,0,0,0.28),inset_0_-50px_68px_rgba(0,0,0,0.38),inset_30px_0_42px_rgba(0,0,0,0.3),inset_-30px_0_42px_rgba(0,0,0,0.3)]"
          />
        </div>
      </div>
    </Link>
  );
}
