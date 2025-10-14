"use client";
import type * as PageTree from "fumadocs-core/page-tree";
import {
  type ComponentProps,
  type ReactNode,
  useMemo,
  useState,
  useEffect,
} from "react";
import { cn } from "../../lib/cn";
import { TreeContextProvider, useTreeContext } from "fumadocs-ui/contexts/tree";
import Link from "fumadocs-core/link";
import { useSearchContext } from "fumadocs-ui/contexts/search";
import { useSidebar } from "fumadocs-ui/contexts/sidebar";
import { cva } from "class-variance-authority";
import { usePathname } from "fumadocs-core/framework";
import { Icons } from "../icons";

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

export function SearchToggle(props: ComponentProps<"button">) {
  const { enabled, setOpenSearch } = useSearchContext();
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform));
  }, []);

  if (!enabled) return;

  return (
    <button
      {...props}
      className={cn(
        "p-2 border-transparent border sm:border-brand-neutral-400 text-start flex items-center gap-2 text-brand-neutral-200 text-sm hover:bg-white/10 rounded-xs",
        "transition-colors duration-200 ease-in-out cursor-pointer",
        props.className
      )}
      onClick={() => setOpenSearch(true)}
    >
      <Icons.search className="size-4" />
      <span className="lg:block hidden">Search docs...</span>
      <span className="hidden sm:block lg:hidden">Search...</span>
      <span className="text-brand-white ml-auto hidden md:block">
        {isMac ? "⌘K" : "Ctrl K"}
      </span>
    </button>
  );
}

function Sidebar() {
  const { root } = useTreeContext();
  const { open } = useSidebar();

  const children = useMemo(() => {
    function renderItems(items: PageTree.Node[]) {
      return items.map((item) => (
        <SidebarItem key={item.$id} item={item}>
          {item.type === "folder" ? renderItems(item.children) : null}
        </SidebarItem>
      ));
    }

    return renderItems(root.children);
  }, [root]);
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
}: {
  item: PageTree.Node;
  children: ReactNode;
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
        {item.icon}
        {item.name}
      </Link>
    );
  }

  if (item.type === "separator") {
    return (
      <p className="text-brand-white mt-6 mb-1 first:mt-0 text-sm font-medium">
        {item.icon}
        {item.name}
      </p>
    );
  }

  return (
    <div>
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
      <div className="pl-4 border-l flex flex-col">{children}</div>
    </div>
  );
}
