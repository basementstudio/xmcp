import { cva, type VariantProps } from "class-variance-authority";

const variants = {
  primary:
    "bg-brand-white text-brand-black hover:bg-white/90 [&_svg>*]:fill-black",
  secondary:
    "border border-brand-neutral-200 hover:bg-white/10 [&_svg>*]:fill-white",
  ghost: "hover:bg-brand-white/10 hover:text-brand-white",
} as const;

export const buttonVariants = cva(
  "inline-flex items-center justify-center p-2 text-sm font-medium transition-colors duration-200 disabled:pointer-events-none focus-visible:outline-none font-mono uppercase rounded-xs",
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

export type ButtonProps = VariantProps<typeof buttonVariants>;
