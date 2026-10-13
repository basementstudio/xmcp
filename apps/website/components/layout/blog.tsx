"use client";
import { ReactNode } from "react";
import type * as PageTree from "fumadocs-core/page-tree";
import { TreeContextProvider } from "fumadocs-ui/contexts/tree";
import { AnchorProvider, TOCItemType } from "fumadocs-core/toc";
import { TableOfContents } from "./table-of-contents";
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
      <main id="nd-blog-layout" className="site-page-grid">
        {children}
      </main>
    </TreeContextProvider>
  );
}

export interface BlogPageProps {
  toc?: TOCItemType[];
  children: ReactNode;
  slug?: string | string[];
  pageActions?: ReactNode;
}

export function BlogPage({
  toc = [],
  slug,
  pageActions,
  ...props
}: BlogPageProps) {
  return (
    <AnchorProvider toc={toc}>
      <article className="site-article">
        <div className="site-article-content">
          <Link href="/blog" className="site-back-link">
            ← Back to blog
          </Link>
          {props.children}
        </div>
      </article>
      {(toc.length > 0 || pageActions) && (
        <aside className="site-page-toc blog-toc">
          {toc.length > 0 && <TableOfContents toc={toc} />}
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
          {pageActions && (
            <div className="site-page-actions">{pageActions}</div>
          )}
        </aside>
      )}
    </AnchorProvider>
  );
}
