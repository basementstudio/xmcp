import { useCallback, useMemo, useRef, useState } from "react";
import type * as PageTree from "fumadocs-core/page-tree";

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

function getInitialOpenState(root: PageTree.Root) {
  const firstFolderId = getFirstFolderId(root.children);
  const firstSeparatorId = getFirstSeparatorId(root.children);
  const initial: Record<string, boolean> = {};

  if (firstFolderId) initial[firstFolderId] = true;
  if (firstSeparatorId) initial[firstSeparatorId] = true;

  return initial;
}

export function useSidebarOpenState(root: PageTree.Root) {
  const initialState = useMemo(() => getInitialOpenState(root), [root]);
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
