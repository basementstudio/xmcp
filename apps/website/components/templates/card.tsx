import Link from "next/link";
import Image from "next/image";
import { cn } from "../../utils/cn";
import type { TemplateItem } from "@/app/templates/utils/content";
import { Tag } from "@/components/ui/tag";
import {
  resolveTemplatePreviewImage,
  shouldBypassImageOptimization,
} from "@/lib/template-preview-image";

function isGenericLabel(value?: string) {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return (
    normalized.length === 0 ||
    normalized === "template" ||
    normalized === "templates"
  );
}

type TemplateCardProps = {
  className?: string;
  href?: string;
  ctaLabel?: string;
  target?: string;
  loading?: "eager" | "lazy";
} & TemplateItem;

export function TemplateCard({
  className,
  href,
  ctaLabel,
  target,
  loading = "lazy",
  ...item
}: TemplateCardProps) {
  const { name, description } = item;
  const displayName = name.replace(/-/g, " ").replace(/\s+/g, " ").trim();
  const previewImage = resolveTemplatePreviewImage(item);
  const category =
    (!isGenericLabel(item.category) ? item.category : undefined) ??
    item.tags?.find((tag) => !isGenericLabel(tag)) ??
    item.category;
  const linkHref = href ?? `/templates/${item.slug}`;
  const defaultsToExternal =
    linkHref.startsWith("http://") || linkHref.startsWith("https://");
  const linkTarget = target ?? (defaultsToExternal ? "_blank" : undefined);
  const isExternal = linkTarget === "_blank";

  return (
    <Link
      href={linkHref}
      target={linkTarget}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={cn(
        "text-left group relative overflow-hidden h-full min-w-0 block",
        isExternal ? "cursor-alias" : "cursor-pointer",
        className
      )}
    >
      <article className="template-card">
        <div className="template-preview">
          <Image
            src={previewImage.src}
            alt={`${displayName} preview`}
            width={1200}
            height={630}
            sizes="(min-width: 1200px) 378px, (min-width: 768px) 50vw, 100vw"
            unoptimized={shouldBypassImageOptimization(previewImage.src)}
            className={cn(
              "h-full w-full object-contain p-5",
              previewImage.isFallback &&
                previewImage.src !== "/templates/fallback.svg" &&
                "template-provider-art"
            )}
            loading={loading}
          />
        </div>
        <div className="p-6 flex flex-col gap-3 flex-1">
          <h3 className="text-brand-white text-lg">{displayName}</h3>
          <p className="text-sm leading-relaxed text-brand-neutral-100">
            {description}
          </p>
          <div className="mt-auto pt-5 flex justify-between items-center gap-3">
            {category && <Tag text={category} />}
            <span className="font-mono text-[10px] text-accent">
              {ctaLabel || "Explore template"} {isExternal ? "↗" : "→"}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
