"use client";

import { cn } from "@/utils/cn";
import { useRouter } from "next/navigation";
import { useEffect, useCallback, useState } from "react";
import Link from "next/link";
import { SidebarItem } from "@/utils/markdown";
import { slugify } from "@/components/markdown/renderer";

export function SidebarClient({ sidebar }: { sidebar: SidebarItem[] }) {
  const router = useRouter();
  const [activeItem, setActiveItem] = useState<string>("");

  const handleLinkClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      const href = event.currentTarget.getAttribute("href");
      if (href) {
        router.push(href);
      }
    },
    [router]
  );

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;

      const headings = document.querySelectorAll("h2, h3, h4");
      let currentActive = "";
      let currentParent = "";

      headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        const top = rect.top + window.scrollY;

        if (scrollPosition >= top) {
          const text = heading.textContent || "";
          const slug = slugify(text);
          currentActive = `#${slug}`;
        }
      });

      if (currentActive) {
        const isDirectParent = sidebar.some(
          (item) => item.slug === currentActive
        );

        if (isDirectParent) {
          currentParent = currentActive;
        } else {
          const allHeadings = Array.from(
            document.querySelectorAll("h2, h3, h4")
          );
          const currentHeadingIndex = allHeadings.findIndex((heading) => {
            const text = heading.textContent || "";
            const slug = slugify(text);
            return `#${slug}` === currentActive;
          });

          if (currentHeadingIndex !== -1) {
            for (let i = currentHeadingIndex; i >= 0; i--) {
              const heading = allHeadings[i];
              const tagName = heading.tagName.toLowerCase();

              if (tagName === "h2") {
                const text = heading.textContent || "";
                const slug = slugify(text);
                const parentSlug = `#${slug}`;

                const parentExists = sidebar.some(
                  (item) => item.slug === parentSlug
                );
                if (parentExists) {
                  currentParent = parentSlug;
                  break;
                }
              }
            }
          }
        }
      }

      setActiveItem(currentParent);
    };

    window.addEventListener("scroll", handleScroll);

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [sidebar]);

  const getActiveParentItem = (): string => {
    if (!activeItem) return "";

    return activeItem;
  };

  const activeParentItem = getActiveParentItem();

  return (
    <div className="absolute left-0 top-0 hidden h-full min-[1200px]:block w-[340px] z-60">
      <nav className="sticky left-8 top-30 z-10 flex h-auto min-h-[600px] flex-col px-8 pl-4 lg:h-[calc(100dvh-64px)]">
        <div className="relative pb-10 pt-10 flex flex-col gap-2.5 overflow-y-auto">
          <div className="flex flex-col gap-4">
            {sidebar.map((item) => {
              const isActive = activeParentItem === item.slug;

              return (
                <Link
                  key={item.slug}
                  href={`/docs/${item.slug}`}
                  onClick={handleLinkClick}
                  className={cn(
                    "w-full leading-[114%] transition-colors duration-150 font-mono uppercase font-medium",
                    isActive
                      ? "text-white"
                      : "text-[rgba(153,153,153,1)] hover:text-white"
                  )}
                >
                  {item.title}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
