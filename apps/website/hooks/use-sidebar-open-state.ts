import { useCallback, useState } from "react";
import { usePathname } from "fumadocs-core/framework";
import { getActiveSidebarSections, type SidebarNode } from "@/lib/docs-sidebar";

export function useSidebarOpenState(nodes: SidebarNode[]) {
  const pathname = usePathname();
  const [state, setState] = useState({
    pathname,
    overrides: {} as Record<string, boolean>,
  });

  let overrides = state.overrides;
  if (state.pathname !== pathname) {
    // Reveal pages reached through search, previous/next links, or history
    // without resetting the reader's choices for unrelated sections.
    overrides = { ...overrides };
    for (const id of getActiveSidebarSections(nodes, pathname)) {
      overrides[id] = true;
    }
    setState({ pathname, overrides });
  }

  const toggle = useCallback((id: string) => {
    setState((previous) => ({
      ...previous,
      overrides: {
        ...previous.overrides,
        [id]: !(previous.overrides[id] ?? true),
      },
    }));
  }, []);

  // Unseen sections (including newly added docs) always start expanded.
  return { openState: overrides, toggle };
}
