"use client";

import { useState, useMemo } from "react";
import { cn } from "../../../utils/cn";
import Link from "next/link";
import { ExampleItem } from "../../../utils/github";
import { Tag } from "@/components/ui/tag";
interface ExampleCardsProps {
  examples: ExampleItem[];
}

export function ExampleCards({ examples }: ExampleCardsProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    examples.forEach((example) => {
      if (example.tags) {
        example.tags.forEach((tag) => tagSet.add(tag));
      }
    });
    return ["All", ...Array.from(tagSet).sort()];
  }, [examples]);

  const filteredExamples = useMemo(() => {
    if (selectedTags.length === 0 || selectedTags.includes("All"))
      return examples;

    return examples.filter((example) => {
      if (!example.tags) return false;
      return selectedTags.some((selectedTag) =>
        example.tags!.includes(selectedTag)
      );
    });
  }, [examples, selectedTags]);

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

  return (
    <div className="col-span-12 flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-brand-white uppercase tracking-wide">
            Filter by Category
          </h3>
          {selectedTags.length > 0 && (
            <button
              onClick={clearFilters}
              className="text-xs text-brand-neutral-200 hover:text-white transition-colors cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={cn(
                "text-xs px-3 py-1.5 border transition-colors duration-200 uppercase tracking-wide cursor-pointer",
                (
                  tag === "All"
                    ? selectedTags.length === 0
                    : selectedTags.includes(tag)
                )
                  ? "border-brand-white bg-brand-white text-brand-black"
                  : "border-brand-neutral-400 text-brand-neutral-200 hover:border-brand-neutral-300 hover:text-brand-white"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[60vh]">
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExamples.length > 0 ? (
            filteredExamples.map((example: ExampleItem, index: number) => (
              <ExampleCard key={`${example.name}-${index}`} {...example} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-brand-neutral-200 text-sm">
                No examples found for the selected filters.
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
  ...item
}: {
  className?: string;
} & ExampleItem) {
  const { name, description, repositoryUrl, tags } = item;

  return (
    <Link
      href={repositoryUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "text-left group relative overflow-visible h-full min-w-[280px] block cursor-alias",
        className
      )}
    >
      <div className="relative border p-4 group-hover:bg-black h-full min-h-[12rem] w-full flex flex-col border-brand-neutral-500 group-hover:border-brand-neutral-300 transition-colors duration-200">
        <div className="mb-3">
          <h4 className="text-brand-white font-medium mt-0 uppercase">
            {name}
          </h4>
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-3 flex flex-col justify-between h-full">
            <p className="text-sm text-brand-neutral-200 leading-relaxed">
              {description}
            </p>
          </div>

          {tags && tags.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Tag text={tags[0]} />
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
