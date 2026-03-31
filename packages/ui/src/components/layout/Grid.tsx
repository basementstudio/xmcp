import React from "react";
import { Grid as BaseGrid } from "../../react/index.js";

interface GridComponentProps {
  columns?: number;
  gap?: number;
  className?: string;
  children?: React.ReactNode;
}

export function Grid({
  columns = 2,
  gap = 16,
  className,
  children,
}: GridComponentProps) {
  return (
    <BaseGrid
      columns={columns}
      gap={gap}
      className={["rounded-xl border border-slate-800/80 bg-slate-900/40 p-4", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </BaseGrid>
  );
}

export default Grid;
