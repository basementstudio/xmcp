"use client";

import { cn } from "@/utils/cn";

interface ActionCardGridProps {
  children: React.ReactNode;
  className?: string;
}

export function ActionCardGrid({ children, className }: ActionCardGridProps) {
  return (
    <div className="not-prose">
      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 my-6",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
