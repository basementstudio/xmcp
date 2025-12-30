"use client";
import { ReactNode } from "react";
import type * as PageTree from "fumadocs-core/page-tree";
import { TreeContextProvider } from "fumadocs-ui/contexts/tree";
import { AnchorProvider, TOCItemType } from "fumadocs-core/toc";
import { useImprovedActiveAnchors } from "@/hooks/use-improved-active-anchors";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getBaseUrl } from "@/lib/base-url";
import { Icons } from "../icons";
import { CopyUrlButton } from "../blog/copy-url";

export interface BlogLayoutProps {
  tree: PageTree.Root;
  children: ReactNode;
}

export function BlogLayout({ tree, children }: BlogLayoutProps) {
  return (
    <TreeContextProvider tree={tree}>
      <main
        id="nd-blog-layout"
        className="flex flex-1 flex-row max-w-[1440px] mx-auto mt-4 pb-20 w-full"
      >
        {children}
      </main>
    </TreeContextProvider>
  );
}

export interface BlogPageProps {
  toc?: TOCItemType[];
  children: ReactNode;
  slug?: string | string[];
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
    <Link
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
    </Link>
  );
}

export function BlogPage({ toc = [], slug, ...props }: BlogPageProps) {
  const activeAnchors = useImprovedActiveAnchors(toc);

  return (
    <AnchorProvider toc={toc}>
      <div className="flex flex-1 w-full px-4 md:px-6 lg:px-8 xl:px-0 items-start">
        <aside className="hidden xl:flex w-[300px] shrink-0 sticky top-[104px] h-[calc(100dvh-156px)] p-4 pt-0 overflow-auto">
          <div className="flex flex-col gap-4 w-full">
            <Link
              href="/blog"
              className="text-sm text-brand-neutral-100 hover:text-brand-white transition-colors"
            >
              ← Back to blog
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col max-w-[860px] w-full h-full mt-8">
          <Link
            href="/blog"
            className="px-4 mb-2 text-sm text-brand-neutral-100 hover:text-brand-neutral-50 transition-colors xl:hidden"
          >
            ← Back to blog
          </Link>
          <article className="flex flex-1 flex-col w-full max-w-[860px] gap-6 py-8 pt-0 px-4 md:px-8 md:mx-auto items-start min-h-[calc(100dvh-96px)]">
            {props.children}
          </article>
        </div>

        {toc.length > 0 && (
          <aside className="hidden xl:flex xl:flex-col w-[286px] shrink-0 sticky top-34 h-[calc(100dvh-96px)] p-4 pt-0 gap-2 overflow-auto">
            <p className="text-sm text-brand-white font-medium">
              Table of contents
            </p>
            <nav className="flex flex-col pb-4 border-b border-white/20">
              {toc.map((item) => (
                <TocItem
                  key={item.url}
                  item={item}
                  activeAnchors={activeAnchors}
                />
              ))}
            </nav>
            {slug && (
              <div className="flex flex-wrap items-center gap-3 text-sm text-brand-neutral-50 w-full group hover:text-brand-white transition-colors">
                <span className="inline-flex items-center gap-2 group-hover:text-brand-white transition-colors">
                  <Icons.link className="size-3.5 text-brand-neutral-100 group-hover:text-brand-white transition-colors" />
                  <CopyUrlButton
                    url={`${getBaseUrl()}/blog/${slug}`}
                    className="group-hover:text-brand-white transition-colors"
                  />
                </span>
              </div>
            )}
          </aside>
        )}
      </div>
    </AnchorProvider>
  );
}
