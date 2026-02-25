"use client";

import { useState } from "react";
import type { ExampleItem } from "@/app/examples/utils/github";
import { Icons } from "@/components/icons";
import { ExampleCards } from "./cards/cards";
import Image from "next/image";

interface ExamplesPageContentProps {
  examples: ExampleItem[];
}

export function ExamplesPageContent({ examples }: ExamplesPageContentProps) {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="col-span-12 grid grid-cols-12 gap-[20px] py-8 md:py-16">
      <div className="relative col-span-12 mb-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-28 h-[460px] sm:-top-32 sm:h-[520px] z-0 [mask-image:radial-gradient(ellipse_at_center,black_52%,transparent_100%)] [mask-repeat:no-repeat] [mask-size:100%_100%]"
        >
          <div className="absolute left-1/2 top-20 h-[180px] w-[300px] -translate-x-1/2 rounded-full bg-[#D9D9D9] opacity-20 blur-[110px] md:h-[240px] md:w-[380px] md:opacity-24 md:blur-[130px]" />
          <Image
            src="/examples/spot.png"
            alt=""
            aria-hidden
            width={1217}
            height={956}
            priority
            className="pointer-events-none select-none absolute left-1/2 top-[-40px] h-auto w-[560px] -translate-x-1/2 rotate-[-42.61deg] opacity-16 mix-blend-plus-lighter md:top-[-80px] md:w-[720px] md:opacity-20"
          />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center max-w-[640px] w-full mx-auto gap-4 pt-10 pb-8 sm:pt-14 sm:pb-10">
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
      </div>

      <ExampleCards examples={examples} searchTerm={searchTerm} />
    </div>
  );
}
