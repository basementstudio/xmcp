import { ArrowTopRightIcon, ArrowRightIcon } from "@/components/ui/site-icons";
import { ContentCard } from "@/components/ui/content-card";
import Image from "next/image";
import { cn } from "../../utils/cn";
import type { TemplateItem } from "@/app/templates/utils/content";
import { Tag } from "@/components/ui/tag";
import ParticleImage from "@/components/particles/image";
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
  const isProviderLogo =
    previewImage.isFallback && previewImage.src !== "/templates/fallback.svg";
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
    <ContentCard
      href={linkHref}
      target={linkTarget}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={cn(isExternal ? "cursor-alias" : "cursor-pointer", className)}
      media={
        isProviderLogo ? (
          <div className="template-particle-art">
            <ParticleImage
              src={previewImage.src}
              width={256}
              height={256}
              className="template-particle-image"
              preset="footer"
            />
          </div>
        ) : (
          <Image
            src={previewImage.src}
            alt={`${displayName} preview`}
            width={1200}
            height={630}
            sizes="(min-width: 740px) 338px, (min-width: 640px) calc((100vw - 64px) / 2), calc(100vw - 40px)"
            unoptimized={shouldBypassImageOptimization(previewImage.src)}
            className="h-full w-full object-contain p-5"
            loading={loading}
          />
        )
      }
    >
      <h3 className="site-card-title">{displayName}</h3>
      <p className="site-card-description">{description}</p>
      <div className="mt-auto pt-3 flex flex-wrap justify-between items-center gap-3">
        {category && <Tag text={category} />}
        <span className="text-xs text-brand-neutral-100 inline-flex items-center gap-1">
          {ctaLabel || "Explore template"}{" "}
          {isExternal ? <ArrowTopRightIcon /> : <ArrowRightIcon />}
        </span>
      </div>
    </ContentCard>
  );
}
