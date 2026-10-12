"use client";
import type * as PageTree from "fumadocs-core/page-tree";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../../lib/cn";
import { TreeContextProvider, useTreeContext } from "fumadocs-ui/contexts/tree";
import Link from "fumadocs-core/link";
import { useSidebar } from "fumadocs-ui/contexts/sidebar";
import { usePathname } from "fumadocs-core/framework";
import scrollIntoView from "scroll-into-view-if-needed";
import { useSidebarOpenState } from "@/hooks/use-sidebar-open-state";
import { buildSidebarTree, type SidebarNode } from "@/lib/docs-sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DocsPageIcon } from "./docs-icons";
import { Icons } from "../icons";
import { AnimatedLink } from "@/components/animated-link";

export interface DocsLayoutProps {
  tree: PageTree.Root;
  children: ReactNode;
}

export function DocsLayout({ tree, children }: DocsLayoutProps) {
  return (
    <TreeContextProvider tree={tree}>
      <main
        id="nd-docs-layout"
        className="flex flex-1 flex-col md:flex-row mt-4 md:pt-4 w-full"
      >
        <Sidebar />
        {children}
      </main>
    </TreeContextProvider>
  );
}

const focusRing =
  "rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-white";
const linkClassName = `flex items-center gap-2 w-full min-w-0 py-1 text-brand-neutral-100 text-sm pl-1 font-medium hover:text-brand-white ${focusRing}`;

/** Rendered in the shared header so DOM order and keyboard order agree. */
export function DocumentationNavigation({ tree }: { tree: PageTree.Root }) {
  const pathname = usePathname();
  const isDocs = pathname === "/docs" || pathname.startsWith("/docs/");
  const nodes = useMemo(() => buildSidebarTree(tree.children), [tree]);
  const { openState, toggle } = useSidebarOpenState(nodes);
  const [section, setSection] = useState({ pathname, open: true });
  if (section.pathname !== pathname) {
    setSection({ pathname, open: true });
  }

  return (
    <Collapsible
      open={isDocs && section.open}
      onOpenChange={(open) => setSection({ pathname, open })}
      className="site-documentation"
    >
      <div className="site-documentation-heading">
        <AnimatedLink href="/docs">Documentation</AnimatedLink>
        {isDocs && (
          <CollapsibleTrigger
            aria-label={
              section.open ? "Collapse documentation" : "Expand documentation"
            }
            className="site-documentation-toggle"
          >
            <Icons.arrowDown
              className={cn("size-3.5", !section.open && "-rotate-90")}
            />
          </CollapsibleTrigger>
        )}
      </div>
      <CollapsibleContent>
        <SidebarNavigation
          nodes={nodes}
          openState={openState}
          toggle={toggle}
          embedded
        />
      </CollapsibleContent>
    </Collapsible>
  );
}

function Sidebar() {
  const { root } = useTreeContext();
  const { open, setOpen } = useSidebar();
  const nodes = useMemo(() => buildSidebarTree(root.children), [root]);
  const { openState, toggle } = useSidebarOpenState(nodes);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1200px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, [setOpen]);

  const navigation = (
    <SidebarNavigation
      nodes={nodes}
      openState={openState}
      toggle={toggle}
      onNavigate={() => setOpen(false)}
    />
  );

  return (
    <>
      <div className="docs-mobile-navigation">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex min-h-11 items-center gap-2 text-sm text-brand-white",
                focusRing
              )}
            >
              <Icons.arrowDown className="size-4" />
              Browse docs
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            aria-labelledby="docs-navigation-title"
            aria-describedby={undefined}
            className="z-[110] h-dvh w-full max-w-sm bg-brand-black p-4 pb-[max(1rem,env(safe-area-inset-bottom))] motion-reduce:animate-none motion-reduce:transition-none"
          >
            <div className="flex shrink-0 items-center justify-between gap-4">
              <p id="docs-navigation-title" className="font-medium">
                Documentation
              </p>
              <SheetClose
                className={cn(
                  "min-h-11 px-2 text-sm text-brand-neutral-100 hover:text-brand-white",
                  focusRing
                )}
              >
                Close
              </SheetClose>
            </div>
            {navigation}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

function SidebarNavigation({
  nodes,
  openState,
  toggle,
  onNavigate,
  embedded = false,
}: {
  nodes: SidebarNode[];
  openState: Record<string, boolean>;
  toggle: (id: string) => void;
  onNavigate?: () => void;
  embedded?: boolean;
}) {
  const pathname = usePathname();
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = ref.current;
    const content = nav?.firstElementChild;
    if (embedded || !nav || !content) return;

    // Only fade edges with more content beyond them. Observe the content too,
    // since opening or closing a section changes the scrollable height.
    const updateEdges = () => {
      nav.dataset.scrollTop = String(nav.scrollTop > 0);
      nav.dataset.scrollBottom = String(
        Math.ceil(nav.scrollTop + nav.clientHeight) < nav.scrollHeight
      );
    };
    const observer = new ResizeObserver(updateEdges);
    observer.observe(nav);
    observer.observe(content);
    nav.addEventListener("scroll", updateEdges, { passive: true });
    updateEdges();
    return () => {
      observer.disconnect();
      nav.removeEventListener("scroll", updateEdges);
    };
  }, [embedded]);

  useEffect(() => {
    const nav = ref.current;
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (nav && active) {
      // Scroll only this navigation pane, never the document behind it.
      scrollIntoView(active, {
        scrollMode: "if-needed",
        block: "center",
        boundary: embedded
          ? (nav.closest(".site-navigation-scroll") ?? nav)
          : nav,
      });
    }
  }, [pathname, embedded]);

  function renderItems(items: SidebarNode[]): ReactNode {
    return items.map(({ id, item, children }) => {
      if (item.type === "page")
        return (
          <SidebarLink
            key={id}
            item={item}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        );
      const isOpen = openState[id] ?? true;
      const arrow = (
        <Icons.arrowDown
          className={cn(
            "size-4 shrink-0 transition-transform duration-200 motion-reduce:transition-none",
            !isOpen && "-rotate-90"
          )}
        />
      );
      return (
        <Collapsible
          key={id}
          open={isOpen}
          onOpenChange={() => toggle(id)}
          className="mt-4 first:mt-0"
        >
          {item.type === "separator" ? (
            <CollapsibleTrigger
              className={cn(
                "flex w-full items-center gap-2 py-1 text-start text-sm font-medium text-brand-white cursor-pointer",
                focusRing
              )}
            >
              {arrow}
              <span className="min-w-0 truncate">{item.name ?? "Section"}</span>
            </CollapsibleTrigger>
          ) : (
            <div className="flex items-center gap-2">
              <CollapsibleTrigger
                className={cn(
                  "shrink-0 p-1 text-brand-neutral-100 hover:text-brand-white",
                  focusRing
                )}
              >
                {arrow}
                <span className="sr-only">
                  {isOpen ? "Collapse " : "Expand "}
                  {item.name}
                </span>
              </CollapsibleTrigger>
              {item.index ? (
                <SidebarLink
                  item={item.index}
                  pathname={pathname}
                  onNavigate={onNavigate}
                />
              ) : (
                <span className="min-w-0 truncate text-sm font-medium">
                  {item.name}
                </span>
              )}
            </div>
          )}
          <CollapsibleContent>
            <div className="mt-1 pl-2 flex flex-col gap-1">
              {renderItems(children)}
            </div>
          </CollapsibleContent>
        </Collapsible>
      );
    });
  }

  return (
    <div
      className={
        embedded ? "docs-navigation-embedded" : "relative min-h-0 h-full flex-1"
      }
    >
      <nav
        ref={ref}
        aria-label="Docs"
        className={
          embedded
            ? "docs-tree"
            : "peer sidebar-scrollbar h-full overflow-y-auto overscroll-contain scroll-py-4 px-1 text-sm"
        }
      >
        <div className={embedded ? "py-2" : "py-4"}>{renderItems(nodes)}</div>
      </nav>
      {!embedded && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-brand-black to-transparent opacity-0 peer-data-[scroll-top=true]:opacity-100"
        />
      )}
      {!embedded && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-brand-black to-transparent opacity-0 peer-data-[scroll-bottom=true]:opacity-100"
        />
      )}
    </div>
  );
}

function SidebarLink({
  item,
  pathname,
  onNavigate,
}: {
  item: PageTree.Item;
  pathname: string;
  onNavigate?: () => void;
}) {
  const active = pathname === item.url;
  return (
    <Link
      onClick={(event) => {
        if (
          !event.defaultPrevented &&
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          onNavigate?.();
        }
      }}
      title={typeof item.name === "string" ? item.name : undefined}
      href={item.url}
      external={item.external}
      aria-current={active ? "page" : undefined}
      className={cn(linkClassName, active && "!text-brand-white")}
    >
      <DocsPageIcon item={item} />
      <span className="min-w-0 truncate">{item.name}</span>
    </Link>
  );
}
