import * as React from "react";
import { cn } from "../../utils/cn";

export interface QuoteProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  name?: string;
  position?: string;
  avatarSrc?: string;
  avatarAlt?: string;
}

export function Quote({
  className,
  children,
  name,
  position,
  avatarSrc,
  avatarAlt,
  ...props
}: QuoteProps) {
  const hasMeta = Boolean(name || position || avatarSrc);
  const content = React.useMemo(() => {
    if (typeof children === "string") return children.trim();
    if (!Array.isArray(children)) return children;

    const normalized = [...children];
    const first = normalized[0];
    const last = normalized[normalized.length - 1];

    if (typeof first === "string") normalized[0] = first.trimStart();
    if (typeof last === "string")
      normalized[normalized.length - 1] = last.trimEnd();

    return normalized;
  }, [children]);

  return (
    <div
      className={cn("my-6 flex flex-col gap-5 border-l border-white/70 pl-4", className)}
      {...props}
    >
      <blockquote className="!my-0 !border-l-0 !pl-0 text-[1.65rem] leading-[1.35] italic text-white/85 [&_p]:inline [&_p]:m-0">
        {"\u201c"}
        {content}
        {"\u201d"}
      </blockquote>

      {hasMeta && (
        <div className="flex items-center gap-3 text-[1.1rem] leading-none text-white/70">
          {avatarSrc ? (
            <span
              role="img"
              aria-label={avatarAlt ?? name ?? ""}
              className="h-6 w-6 shrink-0 rounded-sm bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url("${avatarSrc}")` }}
            />
          ) : null}
          {name ? <span className="text-white/55">{name}</span> : null}
          {position ? <span className="text-white/85">{position}</span> : null}
        </div>
      )}
    </div>
  );
}
