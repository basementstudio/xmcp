import React from "react";
import { useUiState } from "../../renderer/StateProvider.js";
import type { ProgressProps } from "../../schema/types.js";
import { Progress as BaseProgress, Label } from "../../react/index.js";

export function Progress({
  valueKey,
  max = 100,
  label,
  className,
}: ProgressProps) {
  const rawValue = useUiState(valueKey);
  const value = typeof rawValue === "number" ? rawValue : Number(rawValue) || 0;

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <div className="flex items-center justify-between">
          <Label>{label}</Label>
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            {Math.round((value / max) * 100)}%
          </span>
        </div>
      ) : null}
      <BaseProgress value={value} max={max} className={className} />
    </div>
  );
}

export default Progress;
