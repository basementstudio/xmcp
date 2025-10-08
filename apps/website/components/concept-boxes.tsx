import Link from "next/link";
import { cn } from "../utils/cn";
import { ReactNode } from "react";

interface ConceptBoxProps {
  title: string;
  description: string;
  href: string;
}

export function ConceptBox({ title, description, href }: ConceptBoxProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col gap-2 p-4 !no-underline",
        "border border-white/20 rounded-xs",
        "transition-colors duration-200 hover:!opacity-100 hover:border-white/40"
      )}
    >
      <h3 className="text-base font-semibold text-brand-white !m-0">{title}</h3>
      <p className="text-sm text-brand-neutral-200 !m-0">{description}</p>
    </Link>
  );
}

interface ConceptBoxesProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
}

export function ConceptBoxes({ children, columns = 2 }: ConceptBoxesProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4 not-prose", gridCols[columns])}>
      {children}
    </div>
  );
}
