import * as React from "react";
import { cn } from "@/utils/cn";

export interface StepProps extends React.HTMLAttributes<HTMLDivElement> {
  number: number;
  title: string;
  children?: React.ReactNode;
}

const Step = React.forwardRef<HTMLDivElement, StepProps>(
  ({ className, number, title, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative flex gap-4 pb-8 last:pb-0", className)}
        {...props}
      >
        <div className="flex flex-col items-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-mono text-sm font-medium">
            {number}
          </div>
          <div className="mt-2 h-full w-px bg-border last:hidden" />
        </div>
        <div className="flex-1 space-y-2">
          <h3 className="font-mono text-sm font-medium uppercase text-foreground">
            {title}
          </h3>
          {children && (
            <div className="text-sm text-muted-foreground space-y-4">
              {children}
            </div>
          )}
        </div>
      </div>
    );
  }
);
Step.displayName = "Step";

export { Step };
