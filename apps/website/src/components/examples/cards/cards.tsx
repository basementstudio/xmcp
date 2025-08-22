"use client";

import { useState, useMemo } from "react";
import { cn } from "@/utils/cn";
import Link from "next/link";
import { ExampleItem } from "@/utils/github";

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
    return Array.from(tagSet).sort();
  }, [examples]);

  const filteredExamples = useMemo(() => {
    if (selectedTags.length === 0) return examples;

    return examples.filter((example) => {
      if (!example.tags) return false;
      return selectedTags.some((selectedTag) =>
        example.tags!.includes(selectedTag)
      );
    });
  }, [examples, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white uppercase tracking-wide">
            Filter by Category
          </h3>
          {selectedTags.length > 0 && (
            <button
              onClick={clearFilters}
              className="text-xs text-[#BABABA] hover:text-white transition-colors"
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
                selectedTags.includes(tag)
                  ? "border-white bg-white text-black"
                  : "border-white/20 text-white/80 hover:border-white/40 hover:text-white"
              )}
            >
              {tag}
            </button>
          ))}
        </div>

        {selectedTags.length > 0 && (
          <div className="text-sm text-[#BABABA]">
            Showing {filteredExamples.length} of {examples.length} examples
          </div>
        )}
      </div>

      <div className="min-h-[60vh]">
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExamples.length > 0 ? (
            filteredExamples.map((example: ExampleItem, index: number) => (
              <ExampleCard key={`${example.name}-${index}`} {...example} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-[#BABABA] text-sm">
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
        "text-left group relative overflow-visible h-full min-w-[280px] block",
        className
      )}
    >
      <div className="top-1 left-1 absolute w-full h-full group-hover:border group-hover:visible invisible border-[#333]" />
      <div className="relative border p-4 group-hover:bg-black h-full min-h-[12rem] w-full flex flex-col border-[#333]">
        <div className="mb-3">
          <h3 className="italic text-white font-medium">
            {name}{" "}
            <span className="invisible group-hover:visible text-sm">{"→"}</span>
          </h3>
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-3 flex flex-col justify-between h-full">
            <p className="text-sm text-[#BABABA] leading-relaxed">
              {description}
            </p>
          </div>

          {tags && tags.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2 py-1 border border-white/20 text-white/80 uppercase tracking-wide">
                  {tags[0]}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
