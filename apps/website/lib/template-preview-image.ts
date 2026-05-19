type PreviewFallbackInput = {
  previewUrl?: string;
  category?: string;
  tags?: string[];
};

const GLOBAL_FALLBACK_SRC = "/templates/fallback.svg";
const NEXTJS_FALLBACK_SRC = "/templates/nextjs.svg";

const PROVIDER_FALLBACKS: Record<string, string> = {
  auth0: "/templates/auth0.svg",
  betterauth: "/templates/betterauth.svg",
  clerk: "/templates/clerk.svg",
  cloudflare: "/templates/cloudflare.svg",
  express: "/templates/express.svg",
  nestjs: "/templates/nestjs.svg",
  nextjs: NEXTJS_FALLBACK_SRC,
  polar: "/templates/polar.svg",
  react: "/templates/react.svg",
  tailwind: "/templates/tailwind.svg",
  workos: "/templates/workos.svg",
};

const PROVIDER_ALIASES: Record<string, keyof typeof PROVIDER_FALLBACKS> = {
  betterauthjs: "betterauth",
  cloudflareworkers: "cloudflare",
  nest: "nestjs",
  next: "nextjs",
  nextj: "nextjs",
};

function normalizeProviderLabel(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function resolveProviderFallback(
  category?: string,
  tags?: string[]
): string | undefined {
  const candidates = [category, ...(tags ?? [])];

  for (const rawCandidate of candidates) {
    if (!rawCandidate || rawCandidate.trim().length === 0) continue;

    const normalized = normalizeProviderLabel(rawCandidate);
    const mappedProvider =
      PROVIDER_ALIASES[normalized] ??
      (normalized as keyof typeof PROVIDER_FALLBACKS);
    const fallback = PROVIDER_FALLBACKS[mappedProvider];

    if (fallback) {
      return fallback;
    }
  }

  return undefined;
}

export function resolveTemplatePreviewImage({
  previewUrl,
  category,
  tags,
}: PreviewFallbackInput) {
  if (previewUrl) {
    return {
      src: previewUrl,
      isFallback: false,
      isNextJsFallback: false,
    };
  }

  const fallbackSrc =
    resolveProviderFallback(category, tags) ?? GLOBAL_FALLBACK_SRC;

  return {
    src: fallbackSrc,
    isFallback: true,
    isNextJsFallback: fallbackSrc === NEXTJS_FALLBACK_SRC,
  };
}
