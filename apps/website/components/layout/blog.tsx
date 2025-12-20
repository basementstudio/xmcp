"use client";
import { ReactNode } from "react";
import type * as PageTree from "fumadocs-core/page-tree";
import { TreeContextProvider } from "fumadocs-ui/contexts/tree";
import { AnchorProvider, TOCItemType } from "fumadocs-core/toc";
import { useImprovedActiveAnchors } from "@/hooks/use-improved-active-anchors";
import { cn } from "@/lib/utils";
import Link from "next/link";

export interface BlogLayoutProps {
  tree: PageTree.Root;
  children: ReactNode;
}

export function BlogLayout({ tree, children }: BlogLayoutProps) {
  return (
    <TreeContextProvider tree={tree}>
      <main
        id="nd-blog-layout"
        className="flex flex-1 max-w-[1440px] mx-auto mt-4 pb-20 w-full items-start justify-center"
      >
        {children}
      </main>
    </TreeContextProvider>
  );
}

export interface BlogPageProps {
  toc?: TOCItemType[];
  children: ReactNode;
}

function TocItem({
  item,
  activeAnchors,
}: {
  item: TOCItemType;
  activeAnchors: string[];
}) {
  const isActive = activeAnchors.includes(item.url.slice(1));

  return (
    <a
      href={item.url}
      className={cn(
        "text-sm text-brand-neutral-100 py-1 hover:text-brand-neutral-50 transition-colors w-fit",
        isActive && "text-brand-white font-medium"
      )}
      style={{
        paddingLeft: Math.max(0, item.depth - 2) * 16,
      }}
    >
      {item.title}
    </a>
  );
}

export function BlogPage({ toc = [], ...props }: BlogPageProps) {
  const activeAnchors = useImprovedActiveAnchors(toc);

  return (
    <AnchorProvider toc={toc}>
      <div className="w-full px-4 mx-auto max-w-[1440px] flex justify-center items-start gap-12">
        <aside
          className="hidden xl:block w-[286px] shrink-0"
          aria-hidden="true"
        />

        <div className="flex min-w-0 flex-col max-w-[860px] w-full mt-8">
          <Link
            href="/blog"
            className="px-4 mb-2 text-sm text-brand-neutral-100 hover:text-brand-neutral-50 transition-colors"
          >
            ← Back to blog
          </Link>
          <article className="flex flex-1 flex-col w-full max-w-[860px] gap-6 py-8 pt-0 px-4 items-start">
            {props.children}
          </article>
        </div>

        {toc.length > 0 && (
          <aside className="hidden xl:flex xl:flex-col w-[286px] shrink-0 sticky top-24 mt-16 p-4 pt-0 gap-4 max-h-[calc(100vh-120px)] self-start">
            <span className="text-xl text-brand-white">Table of contents</span>
            <nav className="flex flex-col overflow-y-auto">
              {toc.map((item) => (
                <TocItem
                  key={item.url}
                  item={item}
                  activeAnchors={activeAnchors}
                />
              ))}
            </nav>
          </aside>
        )}
      </div>
    </AnchorProvider>
  );
}
