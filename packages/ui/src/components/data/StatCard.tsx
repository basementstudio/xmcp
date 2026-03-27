import React from "react";
import { useUiState } from "../../renderer/StateProvider.js";
import { StatCard as BaseStatCard } from "../../react/index.js";

interface StatCardComponentProps {
  label: string;
  valueKey: string;
  prefix?: string;
  suffix?: string;
  trend?: "up" | "down";
  className?: string;
}

export function StatCard({
  label,
  valueKey,
  prefix,
  suffix,
  trend,
  className,
}: StatCardComponentProps) {
  const value = useUiState(valueKey);
  const displayValue = value != null ? String(value) : "\u2014";

  return (
    <BaseStatCard
      className={className}
      label={label}
      value={
        <span className="inline-flex items-center gap-2">
          <span>
            {prefix && <span>{prefix}</span>}
            {displayValue}
            {suffix && <span>{suffix}</span>}
          </span>
          {trend ? (
            <span className={trend === "up" ? "text-sm text-emerald-400" : "text-sm text-red-400"}>
              {trend === "up" ? "\u25B2" : "\u25BC"}
            </span>
          ) : null}
        </span>
      }
    />
  );
}

export default StatCard;
