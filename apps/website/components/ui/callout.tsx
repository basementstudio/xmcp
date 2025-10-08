import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";
import { Icons } from "./icons";

const calloutVariants = cva(
  "relative rounded-sm border border-[#424242] p-4 flex items-start gap-3 my-4",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "text-destructive dark:border-destructive",
        warning: "text-yellow-700 dark:text-yellow-400",
        info: "text-blue-700 dark:text-blue-400",
        success: "text-green-700 dark:text-green-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CalloutProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof calloutVariants> {}

const Callout = React.forwardRef<HTMLDivElement, CalloutProps>(
  ({ className, variant, children, ...props }, ref) => {
    let IconComponent: React.FC<React.SVGProps<SVGSVGElement>> | null = null;
    if (variant === "warning") {
      IconComponent = Icons.warning;
    } else if (variant === "info") {
      IconComponent = Icons.info;
    }

    return (
      <div
        ref={ref}
        className={cn(calloutVariants({ variant }), className)}
        {...props}
      >
        {IconComponent && (
          <span className="mt-0.5 flex-shrink-0">
            <IconComponent className="h-5 w-5" />
          </span>
        )}
        <div className="[&_p]:leading-relaxed [&_p]:!m-0 [&_p]:text-sm">
          {children}
        </div>
      </div>
    );
  }
);
Callout.displayName = "Callout";

export { Callout, calloutVariants };
