"use client";

import { type ComponentProps, type ReactNode, useMemo } from "react";
import { AnchorProvider, type TOCItemType } from "fumadocs-core/toc";
import { cn } from "../../lib/cn";
import { useTreeContext } from "fumadocs-ui/contexts/tree";
import { usePathname } from "fumadocs-core/framework";
import type * as PageTree from "fumadocs-core/page-tree";
import { TableOfContents } from "./table-of-contents";
import { NavigationLink } from "./navigation-link";

export interface DocsPageProps {
  toc?: TOCItemType[];

  children: ReactNode;
  pageActions?: ReactNode;
}

export function DocsPage({ toc = [], pageActions, ...props }: DocsPageProps) {
  return (
    <AnchorProvider toc={toc}>
      <article className="site-article">
        <div className="site-article-content">
          {props.children}
          <Footer />
        </div>
      </article>
      {(toc.length > 0 || pageActions) && (
        <div className="site-page-toc docs-toc">
          {toc.length > 0 && <TableOfContents toc={toc} />}
          {pageActions && (
            <div className="site-page-actions">{pageActions}</div>
          )}
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
    <p {...props} className={cn("site-description", props.className)}>
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
    <div className="site-card-grid mt-8">
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
