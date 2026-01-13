import { useCallback, useMemo, useRef, useState } from "react";
import type * as PageTree from "fumadocs-core/page-tree";
import { usePathname } from "fumadocs-core/framework";

type SeparatorNode = Extract<PageTree.Node, { type: "separator" }>;

export function getSeparatorId(separator: SeparatorNode, index: number) {
  return (
    separator.$id ?? `separator-${index}-${String(separator.name ?? "section")}`
  );
}

function getFirstFolderId(items: PageTree.Node[]) {
  return items.find((item) => item.type === "folder")?.$id ?? null;
}

function getFirstSeparatorId(items: PageTree.Node[]) {
  const idx = items.findIndex((item) => item.type === "separator");
  if (idx === -1) return null;
  return getSeparatorId(items[idx] as SeparatorNode, idx);
}

function findSeparatorForPath(
  items: PageTree.Node[],
  pathname: string
): string | null {
  let currentSeparatorId: string | null = null;
  let separatorIndex = 0;

  for (const item of items) {
    if (item.type === "separator") {
      currentSeparatorId = getSeparatorId(item, separatorIndex);
      separatorIndex++;
      continue;
    }

    if (item.type === "page" && item.url === pathname) {
      return currentSeparatorId;
    }

    if (item.type === "folder") {
      // Check folder index page
      if (item.index?.url === pathname) {
        return currentSeparatorId;
      }
      // Check folder children recursively
      const found = findInFolderChildren(item.children, pathname);
      if (found) {
        return currentSeparatorId;
      }
    }
  }

  return null;
}

function findInFolderChildren(
  items: PageTree.Node[],
  pathname: string
): boolean {
  for (const item of items) {
    if (item.type === "page" && item.url === pathname) {
      return true;
    }
    if (item.type === "folder") {
      if (item.index?.url === pathname) {
        return true;
      }
      if (findInFolderChildren(item.children, pathname)) {
        return true;
      }
    }
  }
  return false;
}

function getInitialOpenState(root: PageTree.Root, pathname: string) {
  const initial: Record<string, boolean> = {};

  // Find the separator that contains the current page
  const activeSeparatorId = findSeparatorForPath(root.children, pathname);

  if (activeSeparatorId) {
    initial[activeSeparatorId] = true;
  } else {
    // Fallback to first separator/folder if no match found
    const firstFolderId = getFirstFolderId(root.children);
    const firstSeparatorId = getFirstSeparatorId(root.children);
    if (firstFolderId) initial[firstFolderId] = true;
    if (firstSeparatorId) initial[firstSeparatorId] = true;
  }

  return initial;
}

export function useSidebarOpenState(root: PageTree.Root) {
  const pathname = usePathname();
  const initialState = useMemo(
    () => getInitialOpenState(root, pathname),
    [root, pathname]
  );
  const initialOpenRef = useRef<Record<string, boolean>>(initialState);
  const [openState, setOpenState] =
    useState<Record<string, boolean>>(initialState);

  const toggle = useCallback((id: string) => {
    setOpenState((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  return {
    openState,
    toggle,
    initialOpenSnapshot: initialOpenRef.current,
  };
}
