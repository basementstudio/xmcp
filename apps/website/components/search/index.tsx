"use client";

import {
  type ComponentProps,
  createContext,
  Fragment,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/cn";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogTitle,
} from "@radix-ui/react-dialog";
import type {
  HighlightedText,
  ReactSortedResult as BaseResultType,
} from "fumadocs-core/search";
import { cva } from "class-variance-authority";
import { useEffectEvent } from "fumadocs-core/utils/use-effect-event";
import { useRouter } from "fumadocs-core/framework";
import { useOnChange } from "fumadocs-core/utils/use-on-change";
import scrollIntoView from "scroll-into-view-if-needed";
import { SharedProps } from "fumadocs-ui/contexts/search";
import { I18nLabel, useI18n } from "fumadocs-ui/contexts/i18n";
import { Icons } from "../icons";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export type SearchItemType =
  | (BaseResultType & {
      external?: boolean;
    })
  | {
      id: string;
      type: "action";
      node: ReactNode;
      onSelect: () => void;
    };

// needed for backward compatible since some previous guides referenced it
export type { SharedProps };

export interface SearchDialogProps extends SharedProps {
  search: string;
  onSearchChange: (v: string) => void;
  isLoading?: boolean;

  children: ReactNode;
}

const Context = createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  search: string;
  onSearchChange: (v: string) => void;

  isLoading: boolean;
} | null>(null);

const ListContext = createContext<{
  active: string | null;
  setActive: (v: string | null) => void;
} | null>(null);

const TagsListContext = createContext<{
  value?: string;
  onValueChange: (value: string | undefined) => void;
  allowClear: boolean;
} | null>(null);

export function SearchDialog({
  open,
  onOpenChange,
  search,
  onSearchChange,
  isLoading = false,
  children,
}: SearchDialogProps) {
  const [active, setActive] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Context.Provider
        value={useMemo(
          () => ({
            open,
            onOpenChange,
            search,
            onSearchChange,
            active,
            setActive,
            isLoading,
          }),
          [active, isLoading, onOpenChange, onSearchChange, open, search]
        )}
      >
        {children}
      </Context.Provider>
    </Dialog>
  );
}

export function SearchDialogHeader(props: ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={cn("flex flex-row items-center gap-2", props.className)}
    />
  );
}

export function SearchDialogInput(props: ComponentProps<"input">) {
  const { text } = useI18n();
  const { search, onSearchChange } = useSearch();

  return (
    <input
      {...props}
      value={search}
      onChange={(e) => onSearchChange(e.target.value)}
      placeholder={text.search}
      className="w-0 flex-1 bg-transparent text-lg placeholder:text-brand-neutral-200 focus-visible:!outline-none focus:outline-none leading-none"
    />
  );
}

export function SearchDialogClose({
  children = "ESC",
  className,
  ...props
}: ComponentProps<"button">) {
  const { onOpenChange } = useSearch();

  return (
    <button
      type="button"
      onClick={() => onOpenChange(false)}
      className={cn(
        "hidden md:block text-sm font-medium px-1 pt-0.5 pb-0.5",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function SearchDialogFooter(props: ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={cn("bg-brand-white/10 p-3 empty:hidden", props.className)}
    />
  );
}

export function SearchDialogOverlay(
  props: ComponentProps<typeof DialogOverlay>
) {
  return (
    <DialogOverlay
      {...props}
      className={cn(
        "fixed inset-0 z-150 bg-brand-black/70 hidden md:block",
        props.className
      )}
    />
  );
}

export function SearchDialogContent({
  children,
  ...props
}: ComponentProps<typeof DialogContent>) {
  const { text } = useI18n();
  const { open, onOpenChange } = useSearch();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          style={{ height: "60vh", maxHeight: "60vh" }}
          className="!top-16 !bottom-auto w-full md:max-w-[calc(100%-2rem)] mx-auto md:!left-4 md:!right-4 p-0 bg-brand-black border border-brand-neutral-200 flex flex-col [&>button]:hidden data-[state=closed]:!slide-out-to-bottom-0 data-[state=open]:!slide-in-from-bottom-0 data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 rounded-xs z-[200]"
        >
          <SheetTitle className="sr-only">{text.search}</SheetTitle>
          <div className="flex flex-col gap-4 p-4 py-3.5 h-full overflow-hidden">
            {children}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <DialogContent
      aria-describedby={undefined}
      {...props}
      className={cn(
        "fixed bg-brand-black data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 top-4 md:top-[calc(50%-250px)] left-1/2 z-[200] grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 gap-4 rounded-xs border p-4 py-3.5 duration-200 sm:max-w-lg border-brand-neutral-400",
        props.className
      )}
    >
      <DialogTitle className="hidden">{text.search}</DialogTitle>
      {children}
    </DialogContent>
  );
}

export function SearchDialogList({
  items = null,
  Empty = () => (
    <div className="pt-4 pb-8 text-center text-sm text-brand-neutral-200">
      <I18nLabel label="searchNoResult" />
    </div>
  ),
  Item = (props) => <SearchDialogListItem {...props} />,
  ...props
}: Omit<ComponentProps<"div">, "children"> & {
  items: SearchItemType[] | null | undefined;
  /**
   * Renderer for empty list UI
   */
  Empty?: () => ReactNode;
  /**
   * Renderer for items
   */
  Item?: (props: { item: SearchItemType; onClick: () => void }) => ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(() =>
    items && items.length > 0 ? items[0].id : null
  );
  const { onOpenChange } = useSearch();
  const router = useRouter();

  const onOpen = (item: SearchItemType) => {
    if (item.type === "action") {
      item.onSelect();
    } else if (item.external) {
      window.open(item.url, "_blank")?.focus();
    } else {
      router.push(item.url);
    }

    onOpenChange(false);
  };

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (!items || e.isComposing) return;

    if (e.key === "ArrowDown" || e.key == "ArrowUp") {
      let idx = items.findIndex((item) => item.id === active);
      if (idx === -1) idx = 0;
      else if (e.key === "ArrowDown") idx++;
      else idx--;

      setActive(items.at(idx % items.length)?.id ?? null);
      e.preventDefault();
    }

    if (e.key === "Enter") {
      const selected = items.find((item) => item.id === active);

      if (selected) onOpen(selected);
      e.preventDefault();
    }
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(() => {
      const viewport = element.firstElementChild!;

      element.style.setProperty(
        "--fd-animated-height",
        `${viewport.clientHeight}px`
      );
    });

    const viewport = element.firstElementChild;
    if (viewport) observer.observe(viewport);

    window.addEventListener("keydown", onKey);
    return () => {
      observer.disconnect();
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useOnChange(items, () => {
    if (items && items.length > 0) {
      setActive(items[0].id);
    }
  });

  return (
    <div
      {...props}
      ref={ref}
      data-empty={items === null}
      className={cn(
        "overflow-hidden h-(--fd-animated-height) transition-[height]",
        !items && "hidden",
        props.className
      )}
    >
      <div
        className={cn(
          "sidebar-scrollbar w-full flex flex-col overflow-y-auto max-h-[400px] p-1"
        )}
      >
        <ListContext.Provider
          value={useMemo(
            () => ({
              active,
              setActive,
            }),
            [active]
          )}
        >
          {items?.length === 0 && Empty()}

          {items?.map((item) => (
            <Fragment key={item.id}>
              {Item({ item, onClick: () => onOpen(item) })}
            </Fragment>
          ))}
        </ListContext.Provider>
      </div>
    </div>
  );
}

export function SearchDialogListItem({
  item,
  className,
  children,
  renderHighlights: render = renderHighlights,
  ...props
}: ComponentProps<"button"> & {
  renderHighlights?: typeof renderHighlights;
  item: SearchItemType;
}) {
  const { active: activeId, setActive } = useSearchList();
  const active = item.id === activeId;

  if (item.type === "action") {
    children ??= item.node;
  } else {
    children ??= (
      <>
        {item.type !== "page" && (
          <div
            role="none"
            className="absolute start-3 inset-y-0 w-px bg-brand-neutral-400"
          />
        )}
        <p
          className={cn(
            "min-w-0 truncate",
            item.type !== "page" && "ps-4",
            item.type === "page" || item.type === "heading"
              ? "font-medium text-brand-neutral-50"
              : "text-brand-neutral-50"
          )}
        >
          {item.type === "page" && (
            <Icons.paper className="inline me-1.5 mb-0.5 size-4 text-brand-neutral-50" />
          )}
          {item.contentWithHighlights
            ? render(item.contentWithHighlights)
            : item.content}
        </p>
      </>
    );
  }

  return (
    <button
      type="button"
      role="option"
      ref={useCallback(
        (element: HTMLButtonElement | null) => {
          if (active && element) {
            scrollIntoView(element, {
              scrollMode: "if-needed",
              block: "nearest",
              boundary: element.parentElement,
            });
          }
        },
        [active]
      )}
      aria-selected={active}
      className={cn(
        "relative select-none px-2.5 py-2 text-start text-sm rounded-xs",
        active && "text-brand-neutral-50 bg-white/10",
        className
      )}
      onPointerMove={() => setActive(item.id)}
      {...props}
    >
      {children}
    </button>
  );
}

export function SearchDialogIcon() {
  return <Icons.search className="text-brand-neutral-200 size-4" />;
}

export interface TagsListProps extends ComponentProps<"div"> {
  tag?: string;
  onTagChange: (tag: string | undefined) => void;
  allowClear?: boolean;
}

const itemVariants = cva(
  "rounded-md border px-2 py-0.5 text-xs font-medium text-brand-neutral-50 transition-colors",
  {
    variants: {
      active: {
        true: "text-brand-neutral-50 bg-white/10",
      },
    },
  }
);

export function TagsList({
  tag,
  onTagChange,
  allowClear = false,
  ...props
}: TagsListProps) {
  return (
    <div
      {...props}
      className={cn("flex items-center gap-1 flex-wrap", props.className)}
    >
      <TagsListContext.Provider
        value={useMemo(
          () => ({
            value: tag,
            onValueChange: onTagChange,
            allowClear,
          }),
          [allowClear, onTagChange, tag]
        )}
      >
        {props.children}
      </TagsListContext.Provider>
    </div>
  );
}

export function TagsListItem({
  value,
  className,
  ...props
}: ComponentProps<"button"> & {
  value: string;
}) {
  const { onValueChange, value: selectedValue, allowClear } = useTagsList();
  const selected = value === selectedValue;

  return (
    <button
      type="button"
      data-active={selected}
      className={cn(itemVariants({ active: selected, className }))}
      onClick={() => {
        onValueChange(selected && allowClear ? undefined : value);
      }}
      tabIndex={-1}
      {...props}
    >
      {props.children}
    </button>
  );
}

function renderHighlights(highlights: HighlightedText<ReactNode>[]): ReactNode {
  return highlights.map((node, i) => {
    if (node.styles?.highlight) {
      return (
        <span key={i} className="text-brand-neutral-50 underline">
          {node.content}
        </span>
      );
    }

    return <Fragment key={i}>{node.content}</Fragment>;
  });
}

export function useSearch() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("Missing <SearchDialog />");
  return ctx;
}

export function useTagsList() {
  const ctx = useContext(TagsListContext);
  if (!ctx) throw new Error("Missing <TagsList />");
  return ctx;
}

export function useSearchList() {
  const ctx = useContext(ListContext);
  if (!ctx) throw new Error("Missing <SearchDialogList />");
  return ctx;
}
