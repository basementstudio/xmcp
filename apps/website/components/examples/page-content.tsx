"use client";

import { useState } from "react";
import type { ExampleItem } from "@/app/examples/utils/github";
import { Icons } from "@/components/icons";
import { ExampleCards } from "./cards/cards";

interface ExamplesPageContentProps {
  examples: ExampleItem[];
}

export function ExamplesPageContent({ examples }: ExamplesPageContentProps) {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="col-span-12 grid grid-cols-12 gap-[20px] py-8 md:py-16">
      <div className="flex flex-col items-center justify-center max-w-[640px] w-full mx-auto gap-4 col-span-12 mb-8">
        <h1 className="display text-center text-balance z-10 text-gradient">
          Examples & templates
        </h1>
        <p className="text-brand-neutral-100 text-base col-span-12 max-w-[560px] lg:col-span-5 mt-auto text-center">
          Quickstart guides and examples to get you started with xmcp with
          real-world implementations and best practices.
        </p>
        <label htmlFor="examples-search" className="sr-only">
          Search
        </label>
        <div className="relative w-full max-w-[520px]">
          <Icons.search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-neutral-300" />
          <input
            id="examples-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Templates"
            className="w-full rounded-md border border-brand-neutral-400 bg-transparent py-2 pl-10 pr-3 text-sm text-brand-white placeholder:text-brand-neutral-300 focus:border-brand-neutral-200 focus:outline-none"
          />
        </div>
      </div>

      <ExampleCards examples={examples} searchTerm={searchTerm} />
    </div>
  );
}
