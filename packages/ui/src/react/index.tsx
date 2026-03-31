import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { Slot } from "@radix-ui/react-slot";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cva, type VariantProps } from "class-variance-authority";
import { createTheme, type ThemeMode, type ThemeTokens, useTheme, uiShellClassName } from "./theme.js";
import { cn } from "./utils.js";

type DivProps = React.HTMLAttributes<HTMLDivElement>;
type HeadingProps = React.HTMLAttributes<HTMLHeadingElement>;
type ParagraphProps = React.HTMLAttributes<HTMLParagraphElement>;

interface AppShellProps extends DivProps {
  theme?: ThemeMode;
  themeTokens?: Partial<ThemeTokens>;
}

export function AppShell({
  className,
  children,
  theme,
  themeTokens,
  style,
  ...props
}: AppShellProps) {
  const inheritedTheme = useTheme();
  const resolvedTheme =
    theme !== undefined
      ? createTheme(theme, themeTokens)
      : themeTokens
        ? createTheme(inheritedTheme.mode, {
            ...inheritedTheme.tokens,
            ...themeTokens,
          })
        : inheritedTheme;

  return (
    <div
      className={cn(
        uiShellClassName,
        "bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_22%),radial-gradient(circle_at_top_right,hsl(var(--accent)/0.12),transparent_18%),linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--background))_100%)] px-6 py-10",
        className,
      )}
      style={{ ...resolvedTheme.style, ...style }}
      {...props}
    >
      {children}
    </div>
  );
}

export function PageHeader({ className, children, ...props }: DivProps) {
  return (
    <div className={cn("mx-auto mb-10 max-w-6xl", className)} {...props}>
      {children}
    </div>
  );
}

export function PageEyebrow({ className, children, ...props }: DivProps) {
  return (
    <div
      className={cn(
        "mb-3 inline-flex rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function PageTitle({ className, children, ...props }: HeadingProps) {
  return (
    <h1
      className={cn(
        "font-serif text-5xl font-semibold tracking-tight text-[hsl(var(--foreground))]",
        className,
      )}
      {...props}
    >
      {children}
    </h1>
  );
}

export function PageDescription({
  className,
  children,
  ...props
}: ParagraphProps) {
  return (
    <p
      className={cn(
        "mt-4 max-w-3xl text-base leading-7 text-[hsl(var(--muted-foreground))]",
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}

interface GridProps extends DivProps {
  columns?: number;
  gap?: number;
}

export function Grid({
  columns = 2,
  gap = 16,
  className,
  children,
  style,
  ...props
}: GridProps) {
  return (
    <div
      className={cn("ui-react-grid", className)}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap,
        ...style,
      }}
      {...props}
    >
      <style>{`
        @media (max-width: 768px) {
          .ui-react-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      {children}
    </div>
  );
}

const cardClass =
  "rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] shadow-[0_20px_60px_rgba(2,6,23,0.25)] backdrop-blur";

export function Card({ className, children, ...props }: DivProps) {
  return (
    <div className={cn(cardClass, className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: DivProps) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-1.5 border-b border-[hsl(var(--border))] p-6",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: HeadingProps) {
  return (
    <h3
      className={cn(
        "text-lg font-semibold leading-none tracking-tight text-[hsl(var(--card-foreground))]",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: ParagraphProps) {
  return (
    <p className={cn("text-sm text-[hsl(var(--muted-foreground))]", className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }: DivProps) {
  return (
    <div className={cn("p-6 pt-0", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: DivProps) {
  return (
    <div
      className={cn(
        "flex items-center border-t border-[hsl(var(--border))] p-6 pt-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[calc(var(--radius)-0.2rem)] text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] [&_svg]:pointer-events-none [&_svg]:size-4 shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90",
        secondary:
          "border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:opacity-90",
        destructive:
          "bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:opacity-90",
        danger:
          "bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:opacity-90",
        outline:
          "border border-[hsl(var(--border))] bg-transparent text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]",
        ghost:
          "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-10 w-full rounded-[calc(var(--radius)-0.2rem)] border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] shadow-sm transition-colors placeholder:text-[hsl(var(--muted-foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[120px] w-full rounded-[calc(var(--radius)-0.2rem)] border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] shadow-sm transition-colors placeholder:text-[hsl(var(--muted-foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn("text-sm font-medium leading-none text-[hsl(var(--foreground))]", className)}
    {...props}
  />
));
Label.displayName = "Label";

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-[calc(var(--radius)-0.2rem)] border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] shadow-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <span aria-hidden className="text-xs text-[hsl(var(--muted-foreground))]">
        ▾
      </span>
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-[calc(var(--radius)-0.2rem)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] shadow-md",
        position === "popper" && "translate-y-1",
        className,
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

export const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold text-[hsl(var(--muted-foreground))]",
      className,
    )}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm text-[hsl(var(--foreground))] outline-none focus:bg-[hsl(var(--muted))] focus:text-[hsl(var(--foreground))] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>✓</SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

export const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-[hsl(var(--border))]", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]",
        secondary:
          "border-transparent bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]",
        destructive:
          "border-transparent bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))]",
        outline:
          "border-[hsl(var(--border))] text-[hsl(var(--foreground))]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(
      "shrink-0 bg-[hsl(var(--border))]",
      orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
      className,
    )}
    {...props}
  />
));
Separator.displayName = SeparatorPrimitive.Root.displayName;

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-[calc(var(--radius)-0.45rem)] border border-[hsl(var(--primary))] bg-[hsl(var(--background))] shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[hsl(var(--primary))] data-[state=checked]:text-[hsl(var(--primary-foreground))]",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
      <span className="text-xs">✓</span>
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent bg-[hsl(var(--input))] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[hsl(var(--primary))]",
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb className="pointer-events-none block h-5 w-5 rounded-full bg-[hsl(var(--primary-foreground))] shadow-lg transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0" />
  </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;

export function StatCard({
  className,
  label,
  value,
  detail,
}: {
  className?: string;
  label: React.ReactNode;
  value: React.ReactNode;
  detail?: React.ReactNode;
}) {
  return (
    <Card className={className}>
      <CardContent className="space-y-2 p-6">
        <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">{label}</p>
        <div className="text-3xl font-semibold tracking-tight text-[hsl(var(--card-foreground))]">
          {value}
        </div>
        {detail ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{detail}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

const alertVariants = cva(
  "relative w-full rounded-[calc(var(--radius)-0.15rem)] border px-4 py-3 text-sm",
  {
    variants: {
      variant: {
        default:
          "border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]",
        info:
          "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.16)] text-[hsl(var(--foreground))]",
        success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
        warning: "border-amber-500/40 bg-amber-500/10 text-amber-100",
        error: "border-red-500/40 bg-red-500/10 text-red-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export function Alert({
  className,
  variant,
  title,
  children,
  ...props
}: DivProps & {
  variant?: "default" | "info" | "success" | "warning" | "error";
  title?: React.ReactNode;
}) {
  return (
    <div role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      {children}
    </div>
  );
}

export function AlertTitle({ className, ...props }: HeadingProps) {
  return (
    <h5 className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props} />
  );
}

export function AlertDescription({ className, ...props }: ParagraphProps) {
  return <div className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />;
}

function LoaderGlyph() {
  return (
    <svg
      className="h-5 w-5 animate-spin text-[hsl(var(--muted-foreground))]"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function Loader({
  className,
  label,
  ...props
}: DivProps & { label?: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 py-2 text-sm text-[hsl(var(--muted-foreground))]",
        className,
      )}
      {...props}
    >
      <LoaderGlyph />
      {label ? <span>{label}</span> : null}
    </div>
  );
}

export const Table = React.forwardRef<
  HTMLTableElement,
  React.TableHTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
  </div>
));
Table.displayName = "Table";

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn("[&_tr]:border-b [&_tr]:border-[hsl(var(--border))]", className)}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
));
TableBody.displayName = "TableBody";

export const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))] font-medium [&>tr]:last:border-b-0",
      className,
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-[hsl(var(--border))] transition-colors hover:bg-[hsl(var(--muted))] data-[state=selected]:bg-[hsl(var(--muted))]",
      className,
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle text-xs font-medium uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]",
      className,
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td ref={ref} className={cn("p-4 align-middle text-[hsl(var(--foreground))]", className)} {...props} />
));
TableCell.displayName = "TableCell";

export const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption ref={ref} className={cn("mt-4 text-sm text-[hsl(var(--muted-foreground))]", className)} {...props} />
));
TableCaption.displayName = "TableCaption";

// ── Tabs ────────────────────────────────────────────────────────────

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-[calc(var(--radius)-0.15rem)] bg-[hsl(var(--muted))] p-1 text-[hsl(var(--muted-foreground))]",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-[calc(var(--radius)-0.25rem)] px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-[hsl(var(--background))] data-[state=active]:text-[hsl(var(--foreground))] data-[state=active]:shadow-sm",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

// ── Progress ────────────────────────────────────────────────────────

export const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, max = 100, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]",
      className,
    )}
    value={value}
    max={max}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full bg-[hsl(var(--primary))] transition-all duration-300 ease-in-out"
      style={{ width: `${((value ?? 0) / max) * 100}%` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

// ── Link ────────────────────────────────────────────────────────────

export function Link({
  className,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      className={cn(
        "inline-flex items-center gap-1 text-sm font-medium text-[hsl(var(--primary))] underline-offset-4 hover:underline",
        className,
      )}
      {...props}
    >
      {children}
    </a>
  );
}
