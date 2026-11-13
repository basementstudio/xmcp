import {
  Children,
  cloneElement,
  isValidElement,
  type ComponentProps,
  type ReactNode,
  type ReactElement,
} from "react";
import { cn } from "@/lib/cn";

type Element = ReactElement<{
  children?: ReactNode;
  colSpan?: number;
  "data-head"?: string;
}>;
function elements(children: ReactNode): Element[] {
  return Children.toArray(children).filter(isValidElement) as Element[];
}
function text(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) =>
      isValidElement<{ children?: ReactNode }>(child)
        ? text(child.props.children)
        : String(child)
    )
    .join("");
}

/** Preserve table semantics while giving stacked mobile cells their column labels. */
export function ContentTable({
  children,
  className,
  ...props
}: ComponentProps<"table">) {
  const sections = elements(children);
  const head = sections.find((section) => section.type === "thead");
  const labels = elements(
    elements(head?.props.children)[0]?.props.children
  ).map((cell) => text(cell.props.children));
  const annotated = sections.map((section) =>
    section.type !== "tbody"
      ? section
      : cloneElement(
          section,
          {},
          elements(section.props.children).map((row) => {
            let column = 0;
            return cloneElement(
              row,
              {},
              elements(row.props.children).map((cell) => {
                const label = labels[column];
                column += cell.props.colSpan ?? 1;
                return cloneElement(cell, { "data-head": label });
              })
            );
          })
        )
  );
  return (
    <div className="site-table-scroll">
      <table {...props} className={cn("site-table", className)}>
        {annotated}
      </table>
    </div>
  );
}
