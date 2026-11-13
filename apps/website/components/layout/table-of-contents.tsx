"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import type { TOCItemType } from "fumadocs-core/toc";
import { useImprovedActiveAnchors } from "@/hooks/use-improved-active-anchors";
import scrollIntoView from "scroll-into-view-if-needed";

export function TableOfContents({ toc }: { toc: TOCItemType[] }) {
  const current = useImprovedActiveAnchors(toc).at(-1);
  const list = useRef<HTMLOListElement>(null);
  const pill = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const container = list.current;
    const marker = pill.current;
    if (!container || !marker) return;
    const update = () => {
      const link = container.querySelector<HTMLElement>(
        '[aria-current="location"]'
      );
      marker.style.opacity = link ? "1" : "0";
      if (!link) return;
      marker.style.transform = `translateY(${link.parentElement!.offsetTop}px)`;
      marker.style.height = `${link.offsetHeight}px`;
      scrollIntoView(link, {
        scrollMode: "if-needed",
        block: "nearest",
        boundary: container.closest(".docs-toc, .blog-toc") ?? container,
      });
    };
    const observer = new ResizeObserver(update);
    observer.observe(container);
    update();
    return () => observer.disconnect();
  }, [current, toc]);

  return (
    <nav className="site-toc" aria-label="On this page">
      <p className="site-toc-label">On this page</p>
      <div className="site-toc-scroll">
        <ol ref={list} className="site-toc-list">
          {toc.map((item, index) => (
            <li
              key={item.url}
              style={{ "--toc-index": index + 1 } as CSSProperties}
            >
              <a
                className="site-toc-link"
                href={item.url}
                title={typeof item.title === "string" ? item.title : undefined}
                aria-current={
                  current === item.url.slice(1) ? "location" : undefined
                }
              >
                <span className="site-toc-numeral" aria-hidden="true" />
                <span className="site-toc-name">{item.title}</span>
              </a>
            </li>
          ))}
        </ol>
        <span ref={pill} className="site-toc-pill" aria-hidden="true" />
      </div>
    </nav>
  );
}
