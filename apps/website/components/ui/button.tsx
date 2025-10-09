import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const variants = {
  primary:
    "bg-brand-white text-brand-black hover:bg-white/90 [&_svg>*]:fill-black",
  secondary:
    "border border-brand-neutral-400 hover:bg-white/10 [&_svg>*]:fill-white",
  ghost: "hover:bg-brand-white/10 hover:text-brand-white",
} as const;

export const buttonVariants = cva(
  "inline-flex items-center justify-center p-2 text-sm font-medium transition-colors duration-200 disabled:pointer-events-none focus-visible:outline-none rounded-xs cursor-pointer",
  {
    variants: {
      variant: variants,
      // fumadocs use `color` instead of `variant`
      color: variants,
      size: {
        sm: "gap-1 px-2 py-1.5 text-xs",
        icon: "p-1.5 [&_svg]:size-5",
        "icon-sm": "p-1.5 [&_svg]:size-4.5",
        "icon-xs": "p-1 [&_svg]:size-4",
      },
    },
  }
);

interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, color, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, color, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
