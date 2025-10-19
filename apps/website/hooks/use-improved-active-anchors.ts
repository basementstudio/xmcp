"use client";

import { useEffect, useState } from "react";
import type { TOCItemType } from "fumadocs-core/toc";

export function useImprovedActiveAnchors(toc: TOCItemType[]): string[] {
  const [activeAnchors, setActiveAnchors] = useState<string[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      const offset = 120;
      const scrollPosition = window.scrollY + offset;

      // all heading elements based on TOC items
      const headingElements = toc
        .map((item) => {
          const id = item.url.replace("#", "");
          try {
            return document.querySelector(item.url);
          } catch {
            // fallback to getElementById for IDs that start with numbers or contain invalid characters
            return document.getElementById(id);
          }
        })
        .filter(Boolean);

      if (headingElements.length === 0) {
        setActiveAnchors([]);
        return;
      }

      const headingPositions = headingElements.map((heading) => {
        const rect = (heading as HTMLElement).getBoundingClientRect();
        return rect.top + window.scrollY;
      });

      let activeIndex = 0;

      // current active section using the same logic as working TOC
      for (let i = headingPositions.length - 1; i >= 0; i--) {
        if (headingPositions[i] <= scrollPosition) {
          activeIndex = i;
          break;
        }
      }

      // active anchor (fumadocs expects the ID without #)
      if (toc[activeIndex]) {
        const activeId = toc[activeIndex].url.slice(1);
        setActiveAnchors([activeId]);
      } else {
        setActiveAnchors([]);
      }
    };

    handleScroll();

    let ticking = false;
    const scrollListener = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", scrollListener);

    return () => {
      window.removeEventListener("scroll", scrollListener);
    };
  }, [toc]);

  return activeAnchors;
}
