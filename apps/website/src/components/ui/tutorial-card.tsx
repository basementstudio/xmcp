import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const tutorialCardVariants = cva(
  "relative rounded-lg border p-6 bg-background hover:bg-accent/50 transition-colors cursor-pointer group",
  {
    variants: {
      variant: {
        default: "border-border",
        featured: "border-primary/50 bg-primary/5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface TutorialCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tutorialCardVariants> {
  title: string;
  description: string;
  href?: string;
}

const TutorialCard = React.forwardRef<HTMLDivElement, TutorialCardProps>(
  ({ className, variant, title, description, href, ...props }, ref) => {
    const Component = href ? "a" : "div";

    return (
      <Component
        ref={ref as any}
        href={href}
        className={cn(
          tutorialCardVariants({ variant }),
          "no-underline",
          className
        )}
        {...props}
      >
        <div className="space-y-3">
          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </Component>
    );
  }
);
TutorialCard.displayName = "TutorialCard";

export { TutorialCard, tutorialCardVariants };
