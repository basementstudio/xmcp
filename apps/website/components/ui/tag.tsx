import { cn } from "@/lib/utils";

export const Tag = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "py-1 px-2 bg-brand-neutral-600 text-[0.625rem] uppercase border border-dashed border-brand-neutral-400 text-brand-neutral-100",
        className
      )}
    >
      {text}
    </div>
  );
};
