import type * as PageTree from "fumadocs-core/page-tree";

export interface SidebarNode {
  id: string;
  item: PageTree.Node;
  children: SidebarNode[];
}

// Share IDs and section boundaries between rendering and route changes, including
// nested folders, unnamed separators, and nodes without Fumadocs IDs.
export function buildSidebarTree(
  items: PageTree.Node[],
  parentId = "docs"
): SidebarNode[] {
  const result: SidebarNode[] = [];
  let section: SidebarNode | undefined;

  items.forEach((item, index) => {
    const id = `${parentId}/${encodeURIComponent(item.$id ?? `${item.type}-${index}`)}`;
    const node: SidebarNode = {
      id,
      item,
      children:
        item.type === "folder" ? buildSidebarTree(item.children, id) : [],
    };

    if (item.type === "separator") {
      section = node;
      result.push(node);
    } else {
      (section?.children ?? result).push(node);
    }
  });

  return result;
}

export function getActiveSidebarSections(
  nodes: SidebarNode[],
  pathname: string
): string[] {
  function visit(nodes: SidebarNode[]): string[] | undefined {
    for (const { id, item, children } of nodes) {
      if (item.type === "page" && item.url === pathname) return [];
      if (item.type === "folder" && item.index?.url === pathname) return [id];
      const path = visit(children);
      if (path) return [id, ...path];
    }
  }
  return visit(nodes) ?? [];
}
