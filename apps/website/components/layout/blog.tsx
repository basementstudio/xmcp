"use client";
import { ReactNode } from "react";
import type * as PageTree from "fumadocs-core/page-tree";
import { TreeContextProvider } from "fumadocs-ui/contexts/tree";
import {
  AnchorProvider,
  TOCItemType,
  useActiveAnchors,
} from "fumadocs-core/toc";
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

function TocItem({ item }: { item: TOCItemType }) {
  const isActive = useActiveAnchors().includes(item.url.slice(1));

  return (
    <a
      href={item.url}
      className={cn(
        "text-sm text-brand-neutral-100 py-1",
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
  return (
    <AnchorProvider toc={toc}>
      {toc.length > 0 && (
        <div className="sticky top-26 w-[286px] mt-22 shrink-0 h-full p-4 pt-0 overflow-auto max-xl:hidden">
          <h2 className="text-xl text-brand-white mb-3">Table of contents</h2>
          <div className="flex flex-col">
            {toc.map((item) => (
              <TocItem key={item.url} item={item} />
            ))}
          </div>
        </div>
      )}
      <main className="flex w-full min-w-0 flex-col max-w-[860px] h-full mt-8">
        <Link
          href="/blog"
          className="px-4 mb-6 text-sm text-brand-neutral-100 hover:text-brand-white transition-colors"
        >
          &lt; Back to blog
        </Link>
        <article className="flex flex-1 flex-col w-full max-w-[860px] gap-6 py-8 pt-0 mx-auto px-4 items-start h-full">
          {props.children}
        </article>
      </main>
    </AnchorProvider>
  );
}
