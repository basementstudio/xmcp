"use client";
import type * as PageTree from "fumadocs-core/page-tree";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { cn } from "../../lib/cn";
import { TreeContextProvider, useTreeContext } from "fumadocs-ui/contexts/tree";
import Link from "fumadocs-core/link";
import { useSidebar } from "fumadocs-ui/contexts/sidebar";
import { cva } from "class-variance-authority";
import { usePathname } from "fumadocs-core/framework";
import {
  getSeparatorId,
  useSidebarOpenState,
} from "@/hooks/use-sidebar-open-state";
import { Icons } from "../icons";

type SeparatorNode = Extract<PageTree.Node, { type: "separator" }>;
type GroupedItem =
  | { type: "group"; separator: SeparatorNode; items: PageTree.Node[] }
  | { type: "item"; item: PageTree.Node };

function groupBySeparator(items: PageTree.Node[]): GroupedItem[] {
  const grouped: GroupedItem[] = [];
  let currentGroup: {
    separator: SeparatorNode;
    items: PageTree.Node[];
  } | null = null;

  for (const item of items) {
    if (item.type === "separator") {
      if (currentGroup) {
        grouped.push({ type: "group", ...currentGroup });
      }
      currentGroup = { separator: item, items: [] };
      continue;
    }

    if (currentGroup) {
      currentGroup.items.push(item);
    } else {
      grouped.push({ type: "item", item });
    }
  }

  if (currentGroup) {
    grouped.push({ type: "group", ...currentGroup });
  }

  return grouped;
}

export interface DocsLayoutProps {
  tree: PageTree.Root;
  children: ReactNode;
}

export function DocsLayout({ tree, children }: DocsLayoutProps) {
  return (
    <TreeContextProvider tree={tree}>
      <main
        id="nd-docs-layout"
        className="flex flex-1 flex-row max-w-[1440px] mx-auto mt-4 pb-20 w-full"
      >
        <Sidebar />
        {children}
      </main>
    </TreeContextProvider>
  );
}

function Sidebar() {
  const { root } = useTreeContext();
  const { open } = useSidebar();
  const { openState, toggle, initialOpenSnapshot } = useSidebarOpenState(root);

  const children = useMemo(() => {
    function renderItems(items: PageTree.Node[]) {
      return groupBySeparator(items).map((entry, index) => {
        if (entry.type === "group") {
          const separatorId = getSeparatorId(entry.separator, index);
          const isOpen = openState[separatorId] ?? false;
          const disableInitialAnimation =
            initialOpenSnapshot[separatorId] ?? false;

          const childContent = renderItems(entry.items);

          return (
            <SidebarSeparator
              key={separatorId}
              item={entry.separator}
              itemId={separatorId}
              isOpen={isOpen}
              onToggle={toggle}
              disableInitialAnimation={disableInitialAnimation}
            >
              {childContent}
            </SidebarSeparator>
          );
        }

        const item = entry.item;
        const itemId =
          item.$id ?? `${item.type}-${index}-${String(item.name ?? "item")}`;
        const isOpen = openState[itemId] ?? false;

        return (
          <SidebarItem
            key={itemId}
            item={item}
            itemId={itemId}
            isOpen={isOpen}
            onToggle={toggle}
          >
            {item.type === "folder" ? renderItems(item.children) : null}
          </SidebarItem>
        );
      });
    }

    return renderItems(root.children);
  }, [openState, root, toggle, initialOpenSnapshot]);
  return (
    <aside
      className={cn(
        "sidebar-scrollbar fixed flex flex-col shrink-0 p-4 pt-0 top-28 z-20 text-sm overflow-auto md:sticky md:h-[calc(100dvh-156px)] md:w-[300px]",
        "max-md:inset-x-0 max-md:bottom-0 max-md:bg-fd-background",
        !open && "max-md:invisible"
      )}
    >
      {children}
    </aside>
  );
}

const linkVariants = cva(
  "flex items-center gap-2 w-full py-1 text-brand-neutral-100 [&_svg]:size-4 text-sm pl-1 font-medium",
  {
    variants: {
      active: {
        true: "!text-brand-white",
        false: "hover:text-brand-white",
      },
    },
  }
);

function SidebarItem({
  item,
  children,
  itemId,
  isOpen,
  onToggle,
}: {
  item: PageTree.Node;
  children: ReactNode;
  itemId: string;
  isOpen?: boolean;
  onToggle?: (id: string) => void;
}) {
  const pathname = usePathname();

  if (item.type === "page") {
    return (
      <Link
        href={item.url}
        className={linkVariants({
          active: pathname === item.url,
        })}
      >
        {item.name}
      </Link>
    );
  }

  if (item.type === "separator") {
    return null;
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={isOpen ? "Collapse section" : "Expand section"}
          aria-expanded={isOpen}
          onClick={() => onToggle?.(itemId)}
          className="rounded px-1 text-xs text-brand-neutral-100 hover:text-brand-white"
        >
          <Icons.arrowDown
            className={cn(
              "size-4 transition-transform duration-200 ease-in-out group-hover:rotate-180",
              isOpen ? "rotate-0" : "-rotate-90"
            )}
          />
        </button>
        {item.index ? (
          <Link
            className={linkVariants({
              active: pathname === item.index.url,
            })}
            href={item.index.url}
          >
            {item.index.icon}
            {item.index.name}
          </Link>
        ) : (
          <p className={cn(linkVariants(), "text-start")}>
            {item.icon}
            {item.name}
          </p>
        )}
      </div>
      {isOpen ? (
        <div className="pl-4 border-l flex flex-col">{children}</div>
      ) : null}
    </div>
  );
}

function SidebarSeparator({
  item,
  children,
  itemId,
  isOpen,
  onToggle,
  disableInitialAnimation,
}: {
  item: Extract<PageTree.Node, { type: "separator" }>;
  children: ReactNode;
  itemId: string;
  isOpen?: boolean;
  onToggle?: (id: string) => void;
  disableInitialAnimation?: boolean;
}) {
  return (
    <div className="mt-4 first:mt-0">
      <button
        type="button"
        aria-label={isOpen ? "Collapse section" : "Expand section"}
        aria-expanded={isOpen}
        onClick={() => onToggle?.(itemId)}
        className="group flex w-full items-center gap-2 text-start text-sm font-medium text-brand-white cursor-pointer"
      >
        <span className="rounded text-xs text-brand-neutral-100 transition-colors duration-200 group-hover:text-brand-white">
          <Icons.arrowDown
            className={cn(
              "size-4 transition-transform duration-200 ease-in-out",
              isOpen ? "rotate-0" : "-rotate-90"
            )}
          />
        </span>
        <span className="mt-[2px]">{item.name}</span>
      </button>
      <AnimatedGroup
        isOpen={isOpen}
        disableInitialAnimation={disableInitialAnimation}
      >
        <div className="mt-1 pl-8 flex flex-col gap-1">{children}</div>
      </AnimatedGroup>
    </div>
  );
}

function AnimatedGroup({
  isOpen,
  children,
  disableInitialAnimation,
}: {
  isOpen?: boolean;
  children: ReactNode;
  disableInitialAnimation?: boolean;
}) {
  const [initialized, setInitialized] = useState(!disableInitialAnimation);

  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
    }
  }, [initialized]);

  return (
    <div
      aria-hidden={!isOpen}
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-200 ease-in-out",
        disableInitialAnimation && !initialized && isOpen
          ? "transition-none"
          : null,
        isOpen ? "opacity-100 grid-rows-[1fr]" : "opacity-0 grid-rows-[0fr]"
      )}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}
