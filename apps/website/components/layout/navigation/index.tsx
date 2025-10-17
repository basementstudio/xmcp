import { cn } from "../../../utils/cn";
import Link from "next/link";
import { SidebarItem } from "../../../utils/markdown";

type ArticleNavigationProps = {
  prev: SidebarItem | null;
  next: SidebarItem | null;
  className?: string;
};

export function ArticleNavigation({
  prev,
  next,
  className,
}: ArticleNavigationProps) {
  return (
    <nav
      className={cn(
        "flex items-center justify-between border-t border-border mt-8 pt-8",
        className
      )}
    >
      {prev ? (
        <Link
          href={`/docs/${prev.slug}`}
          className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <div className="flex flex-col items-start">
            <span className="text-xs text-muted-foreground/70">Previous</span>
            <span>{prev.title}</span>
          </div>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={`/docs/${next.slug}`}
          className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <div className="flex flex-col items-end">
            <span className="text-xs text-muted-foreground/70">Next</span>
            <span>{next.title}</span>
          </div>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
