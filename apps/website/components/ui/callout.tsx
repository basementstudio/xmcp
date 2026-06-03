import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";
import { Icons } from "./icons";

const calloutVariants = cva(
  "relative flex flex-col gap-4 my-4 border-l pl-4",
  {
    variants: {
      variant: {
        default: "border-[#D4943D]",
        destructive: "border-[#E8737A]",
        warning: "border-[#E8737A]",
        info: "border-[#5BB8B0]",
        success: "border-green-400",
      },
    },
  defaultVariants: {
    variant: "default",
  },
});

const titleColorMap: Record<string, string> = {
  default: "text-[#D4943D]",
  destructive: "text-[#E8737A]",
  warning: "text-[#E8737A]",
  info: "text-[#5BB8B0]",
  success: "text-green-400",
};

const defaultTitleMap: Record<string, string> = {
  default: "Callout",
  destructive: "Warning",
  warning: "Warning",
  info: "Info",
  success: "Success",
};

export interface CalloutProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof calloutVariants> {
  title?: string;
  icon?: string;
}

const Callout = React.forwardRef<HTMLDivElement, CalloutProps>(
  ({ className, variant, title, children, ...props }, ref) => {
    const resolvedVariant = variant ?? "default";

    let IconComponent: React.FC<React.SVGProps<SVGSVGElement>> | null = null;
    if (resolvedVariant === "warning" || resolvedVariant === "destructive") {
      IconComponent = Icons.warning;
    } else if (resolvedVariant === "info") {
      IconComponent = Icons.info;
    } else if (resolvedVariant === "default") {
      IconComponent = Icons.callout;
    }

    const displayTitle =
      title ?? defaultTitleMap[resolvedVariant] ?? "Callout";
    const titleColor = titleColorMap[resolvedVariant] ?? "";

    return (
      <div
        ref={ref}
        className={cn(calloutVariants({ variant }), className)}
        {...props}
      >
        <div className="flex items-center gap-2">
          {IconComponent && (
            <span className="flex-shrink-0">
              <IconComponent className="size-5" />
            </span>
          )}
          <span className={cn("text-sm font-medium", titleColor)}>
            {displayTitle}
          </span>
        </div>
        <div className="[&_p]:leading-relaxed [&_p]:!m-0 [&_p]:text-sm text-foreground">
          {children}
        </div>
      </div>
    );
  }
);
Callout.displayName = "Callout";

export { Callout, calloutVariants };
