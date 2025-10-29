"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { track } from "@vercel/analytics";

const variants = {
  primary:
    "bg-brand-white text-brand-black hover:bg-white/90 [&_svg>*]:fill-black border border-brand-white",
  secondary: "border border-brand-white hover:bg-white/10 [&_svg>*]:fill-white",
  ghost: "hover:bg-brand-white/10 hover:text-brand-white",
} as const;

export const buttonVariants = cva(
  "inline-flex items-center justify-center p-2 text-sm transition-colors duration-200 disabled:pointer-events-none focus-visible:outline-none rounded-xs cursor-pointer font-medium min-w-[120px]",
  {
    variants: {
      variant: variants,
      // fumadocs use `color` instead of `variant`
      color: variants,
      size: {
        sm: "gap-1 px-2 py-1.5 text-sm min-w-auto",
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
  trackIntent?: string;
  trackLocation?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      trackIntent,
      trackLocation,
      className,
      variant,
      color,
      size,
      asChild = false,
      onClick,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      track("button clicked", {
        location: trackLocation || window?.location?.pathname || "unknown",
        intent: trackIntent || "unknown",
      });

      onClick?.(event);
    };

    return (
      <Comp
        onClick={handleClick}
        className={cn(buttonVariants({ variant, color, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
