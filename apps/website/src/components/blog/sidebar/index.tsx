"use client";

import { cn } from "@/utils/cn";
import { useCallback, useEffect, useState } from "react";
import { slugify } from "@/components/markdown/renderer";
import Link from "next/link";

export function BlogSidebar() {
  const [activeItem, setActiveItem] = useState<string>("");
  const [tocItems, setTocItems] = useState<
    Array<{ id: string; text: string; level: number }>
  >([]);

  const handleLinkClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      const href = event.currentTarget.getAttribute("href");
      if (href) {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    },
    []
  );

  useEffect(() => {
    // Get headings and ensure they have IDs
    const headings = document.querySelectorAll("h2, h3, h4");
    const items: Array<{ id: string; text: string; level: number }> = [];

    headings.forEach((heading) => {
      const text = heading.textContent || "";
      const slug = slugify(text);

      // Ensure the heading has an ID
      if (!heading.id) {
        heading.id = slug;
      }

      items.push({
        id: slug,
        text,
        level: parseInt(heading.tagName.charAt(1), 10),
      });
    });

    setTocItems(items);

    const handleScroll = () => {
      let currentActive = "";

      // Find the current heading based on scroll position
      for (let i = headings.length - 1; i >= 0; i--) {
        const heading = headings[i];
        const rect = heading.getBoundingClientRect();
        const top = rect.top + window.scrollY;

        if (window.scrollY >= top - 50) {
          const text = heading.textContent || "";
          const slug = slugify(text);
          currentActive = slug;
          break;
        }
      }

      setActiveItem(currentActive);
    };

    // Initial call to set active item
    handleScroll();

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="absolute left-0 top-0 hidden h-full min-[1200px]:block w-[340px] z-60">
      <nav className="sticky left-8 top-30 z-10 flex h-auto min-h-[600px] flex-col px-8 pl-4 lg:h-[calc(100dvh-64px)]">
        <div className="relative pb-10 pt-10 flex flex-col gap-2.5 overflow-y-auto">
          <div className="flex flex-col gap-4">
            {tocItems.map((item) => {
              const isActive = activeItem === item.id;

              return (
                <Link
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={handleLinkClick}
                  className={cn(
                    "w-full leading-[114%] transition-colors duration-150 font-mono uppercase font-medium",
                    isActive
                      ? "text-white"
                      : "text-[rgba(153,153,153,1)] hover:text-white"
                  )}
                >
                  {item.text}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
