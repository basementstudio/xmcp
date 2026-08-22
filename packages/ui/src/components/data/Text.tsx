import React, { useContext } from "react";
import { UiStateContext } from "../../renderer/StateProvider.js";
import { resolveTemplate } from "../../actions/executor.js";
import { cn } from "../../react/utils.js";

interface TextComponentProps {
  content: string;
  variant?: "h1" | "h2" | "h3" | "body" | "caption";
  className?: string;
}

const variantStyles: Record<string, string> = {
  h1: "text-4xl font-bold tracking-tight",
  h2: "text-2xl font-semibold tracking-tight",
  h3: "text-xl font-semibold",
  body: "text-base",
  caption: "text-sm",
};

export function Text({ content, variant = "body", className: overrideClassName }: TextComponentProps) {
  const ctx = useContext(UiStateContext);
  const stateValues = ctx?.state.values ?? {};
  const resolvedContent = resolveTemplate(content, stateValues);

  const className = cn(
    variantStyles[variant] ?? variantStyles.body,
    variant === "caption" ? "text-slate-400" : "text-slate-50",
    overrideClassName,
  );

  switch (variant) {
    case "h1":
      return <h1 className={className}>{resolvedContent}</h1>;
    case "h2":
      return <h2 className={className}>{resolvedContent}</h2>;
    case "h3":
      return <h3 className={className}>{resolvedContent}</h3>;
    case "caption":
      return <span className={className}>{resolvedContent}</span>;
    default:
      return <p className={className}>{resolvedContent}</p>;
  }
}

export default Text;
