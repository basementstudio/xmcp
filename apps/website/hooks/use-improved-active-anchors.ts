"use client";

import { useEffect, useState } from "react";
import type { TOCItemType } from "fumadocs-core/toc";

export function useImprovedActiveAnchors(toc: TOCItemType[]): string[] {
  const [activeAnchors, setActiveAnchors] = useState<string[]>([]);

  useEffect(() => {
    const headings = toc.flatMap((item) => {
      const element = document.getElementById(
        decodeURIComponent(item.url.slice(1))
      );
      return element ? [element] : [];
    });
    let frame = 0;

    const update = () => {
      frame = 0;
      let current = headings[0]?.id;
      // A final section may be too short to reach the normal anchor inset.
      const atBottom =
        window.scrollY > 0 &&
        Math.ceil(window.scrollY + window.innerHeight) >=
          document.documentElement.scrollHeight;
      for (const heading of headings) {
        // Match native anchor positioning, including subpixel scroll rounding.
        const inset =
          parseFloat(getComputedStyle(heading).scrollMarginTop) || 0;
        const top = heading.getBoundingClientRect().top;
        if (top <= inset + 1 || (atBottom && top < window.innerHeight))
          current = heading.id;
        else break;
      }
      setActiveAnchors((previous) =>
        previous[0] === current ? previous : current ? [current] : []
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
    schedule();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
    };
  }, [toc]);

  return activeAnchors;
}
