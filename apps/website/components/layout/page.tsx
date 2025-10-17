"use client";

import { type ComponentProps, type ReactNode, useMemo } from "react";
import {
  AnchorProvider,
  type TOCItemType,
  useActiveAnchors,
} from "fumadocs-core/toc";
import { cn } from "../../lib/cn";
import { useTreeContext } from "fumadocs-ui/contexts/tree";
import { usePathname } from "fumadocs-core/framework";
import type * as PageTree from "fumadocs-core/page-tree";
import { NavigationLink } from "./navigation-link";

export interface DocsPageProps {
  toc?: TOCItemType[];

  children: ReactNode;
  pageActions?: ReactNode;
}

export function DocsPage({ toc = [], pageActions, ...props }: DocsPageProps) {
  return (
    <AnchorProvider toc={toc}>
      <main className="flex w-full min-w-0 flex-col max-w-[860px] h-full mt-8">
        <article className="flex flex-1 flex-col w-full max-w-[860px] gap-6 px-4 py-8 pt-0 md:px-8 md:mx-auto">
          {props.children}
          <Footer />
        </article>
      </main>
      {(toc.length > 0 || pageActions) && (
        <div className="sticky top-34 w-[286px] shrink-0 h-[calc(100dvh-96px)] p-4 pt-0 overflow-auto max-xl:hidden">
          {toc.length > 0 && (
            <>
              <p className="text-sm text-brand-white mb-2 font-medium">
                On this page
              </p>
              <div className="flex flex-col pb-4 border-b border-white/20">
                {toc.map((item) => (
                  <TocItem key={item.url} item={item} />
                ))}
              </div>
            </>
          )}
          {pageActions && <div className="mt-4">{pageActions}</div>}
        </div>
      )}
    </AnchorProvider>
  );
}

export function DocsBody(props: ComponentProps<"div">) {
  return (
    <div {...props} className={cn("prose prose-invert", props.className)}>
      {props.children}
    </div>
  );
}

export function DocsDescription(props: ComponentProps<"p">) {
  // don't render if no description provided
  if (props.children === undefined) return null;

  return (
    <p
      {...props}
      className={cn("text-lg text-brand-neutral-50 pb-4", props.className)}
    >
      {props.children}
    </p>
  );
}

export function DocsTitle(props: ComponentProps<"h1">) {
  return (
    <h1
      {...props}
      className={cn("text-3xl font-medium text-white", props.className)}
    >
      {props.children}
    </h1>
  );
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

function Footer() {
  const { root } = useTreeContext();
  const pathname = usePathname();
  const flatten = useMemo(() => {
    const result: PageTree.Item[] = [];

    function scan(items: PageTree.Node[]) {
      for (const item of items) {
        if (item.type === "page") result.push(item);
        else if (item.type === "folder") {
          if (item.index) result.push(item.index);
          scan(item.children);
        }
      }
    }

    scan(root.children);
    return result;
  }, [root]);

  const { previous, next } = useMemo(() => {
    const idx = flatten.findIndex((item) => item.url === pathname);

    if (idx === -1) return {};
    return {
      previous: flatten[idx - 1],
      next: flatten[idx + 1],
    };
  }, [flatten, pathname]);

  return (
    <div className="flex flex-row justify-between gap-4 items-stretch mt-8">
      {previous ? (
        <NavigationLink item={previous} direction="previous" />
      ) : (
        <div className="flex-1" />
      )}
      {next ? (
        <NavigationLink item={next} direction="next" />
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
}
