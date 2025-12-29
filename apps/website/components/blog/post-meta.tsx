import { CopyUrlButton } from "./copy-url";
import { Icons } from "../icons";

interface PostMetaProps {
  readingTimeMinutes: number | null;
  shareUrl: string;
  date?: string;
}

export function PostMeta({
  readingTimeMinutes,
  shareUrl,
  date,
}: PostMetaProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-brand-neutral-50 pb-3 w-full border-b border-brand-neutral-500">
      {readingTimeMinutes && (
        <span className="inline-flex items-center gap-1">
          <Icons.clock className="size-3.5 text-brand-neutral-50" />{" "}
          {readingTimeMinutes} min read
        </span>
      )}
      <span className="inline-flex items-center gap-1">
        <Icons.link className="size-3.5 text-brand-neutral-50" />
        <CopyUrlButton url={shareUrl} />
      </span>
      <span className="ml-auto">
        {date && (
          <time dateTime={date} className="uppercase tracking-wide">
            {new Date(date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </time>
        )}
      </span>
    </div>
  );
}
