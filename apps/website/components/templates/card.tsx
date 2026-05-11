import Link from "next/link";
import Image from "next/image";
import { cn } from "../../utils/cn";
import type { TemplateItem } from "@/app/templates/utils/github";
import { Tag } from "@/components/ui/tag";
import { resolveTemplatePreviewImage } from "@/lib/template-preview-image";
import Shadow from "./shadow.png";

function getFallbackImageClass(src: string) {
  switch (src) {
    case "/templates/auth0.svg":
      return "bottom-6 left-[54%] -translate-x-1/2 w-[60%]";
    case "/templates/clerk.svg":
      return "bottom-8 left-[52%] -translate-x-1/2 w-[68%]";
    case "/templates/nestjs.svg":
      return "bottom-8 left-[54%] -translate-x-1/2 w-[74%]";
    case "/templates/workos.svg":
      return "bottom-8 left-[56%] -translate-x-1/2 w-[72%]";
    case "/templates/cloudflare.svg":
      return "bottom-4 left-[59%] -translate-x-1/2 w-[86%]";
    case "/templates/express.svg":
      return "bottom-4 left-[54%] -translate-x-1/2 w-[84%]";
    case "/templates/betterauth.svg":
      return "bottom-4 left-[55%] -translate-x-1/2 w-[76%]";
    case "/templates/polar.svg":
      return "bottom-2 left-[55%] -translate-x-1/2 w-[88%]";
    case "/templates/react.svg":
      return "bottom-0 left-[56%] -translate-x-1/2 w-[96%]";
    case "/templates/tailwind.svg":
      return "bottom-0 left-[54%] -translate-x-1/2 w-full";
    default:
      return "-bottom-7 left-0 w-full";
  }
}

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
} & TemplateItem;

export function TemplateCard({
  className,
  href,
  ctaLabel,
  target,
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
        "text-left group relative overflow-hidden h-full min-w-[280px] block",
        isExternal ? "cursor-alias" : "cursor-pointer",
        className
      )}
    >
      <div className="relative border group-hover:bg-black h-full min-h-72 w-full flex flex-col border-brand-neutral-500 group-hover:border-brand-neutral-300 transition-colors duration-200 overflow-hidden gap-1">
        <div className="p-4 pb-0 flex flex-col gap-2 relative z-10">
          <h4 className="text-brand-white font-medium mt-0 text-[1.125rem]">
            {displayName}
          </h4>
        </div>

        <div className="flex-1 flex flex-col justify-between relative z-10">
          <div className="space-y-3 flex flex-col justify-between h-full px-4">
            <p className="text-sm text-brand-neutral-100 leading-relaxed">
              {description}
            </p>
          </div>

          {(category || ctaLabel) && (
            <div className="flex items-center justify-between mt-4 px-4 pb-4 gap-3">
              {category && <Tag text={category} />}
              {ctaLabel && (
                <span className="text-[0.625rem] uppercase tracking-wide border border-brand-neutral-400 px-2 py-1 text-brand-neutral-50">
                  {ctaLabel}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 overflow-hidden opacity-60 group-hover:opacity-75 transition-opacity duration-200">
            <div className="absolute inset-0 overflow-hidden">
              <Image
                src={previewImage.src}
                alt={`${displayName} preview`}
                width={1200}
                height={630}
                sizes="(max-width: 768px) 100vw, 33vw"
                unoptimized
                className={cn(
                  "absolute opacity-70 [mask-image:linear-gradient(to_top,black_0%,black_62%,transparent_100%)]",
                  previewImage.isFallback && previewImage.isNextJsFallback
                    ? "bottom-7 left-1/2 -translate-x-1/2 w-[78%]"
                    : previewImage.isFallback
                      ? getFallbackImageClass(previewImage.src)
                      : "-bottom-7 left-0 w-full"
                )}
                priority={false}
              />
            </div>
            <Image
              src="/textures/text5.png"
              alt=""
              aria-hidden
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="absolute inset-0 h-full w-full object-cover [transform:scaleX(-1)] mix-blend-screen opacity-10 group-hover:opacity-55 transition-opacity duration-300"
              priority={false}
            />
            <Image
              src={Shadow}
              alt=""
              aria-hidden
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="absolute inset-x-0 bottom-0 h-[140px] object-cover opacity-10 group-hover:opacity-15 transition-opacity duration-200"
              priority={false}
            />
          </div>
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-100 transition-opacity duration-300 group-hover:opacity-66 [box-shadow:inset_0_38px_58px_rgba(0,0,0,0.28),inset_0_-50px_68px_rgba(0,0,0,0.38),inset_30px_0_42px_rgba(0,0,0,0.3),inset_-30px_0_42px_rgba(0,0,0,0.3)]"
          />
        </div>
      </div>
    </Link>
  );
}
