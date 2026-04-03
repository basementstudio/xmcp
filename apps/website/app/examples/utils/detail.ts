import type { ExampleItem } from "./github";

export function stripLeadingHeading(markdown: string) {
  const lines = markdown.split("\n");
  const first = lines.findIndex((line) => line.trim().length > 0);
  if (first === -1) return markdown;

  const line = lines[first];
  const next = lines[first + 1] ?? "";

  const isAtx = /^#{1,6}\s+/.test(line);
  const isSetextEquals = /^=+$/.test(next.trim());
  const isSetextDashes =
    /^-{2,}$/.test(next.trim()) && !/^\s/.test(line) && line.trim().split(/\s+/).length <= 10;
  const isSetext = next.trim().length > 0 && (isSetextEquals || isSetextDashes);

  if (!isAtx && !isSetext) return markdown;

  const removeCount = isSetext ? 2 : 1;
  lines.splice(first, removeCount);

  while (first < lines.length && lines[first].trim().length === 0) {
    lines.splice(first, 1);
  }

  return lines.join("\n");
}

export function isTypeLabel(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized === "example" || normalized === "template";
}

export function normalizeDisplayLabel(value: string) {
  return value.replace(/-/g, " ").replace(/\s+/g, " ").trim();
}

export function humanizeMetadataName(value: string) {
  const normalized = normalizeDisplayLabel(value);
  const uppercaseTokens = new Set([
    "api",
    "ai",
    "sdk",
    "http",
    "https",
    "jwt",
    "mcp",
    "ui",
    "css",
    "xml",
    "json",
    "url",
    "id",
  ]);

  return normalized
    .split(" ")
    .map((token) => {
      const lower = token.toLowerCase();
      if (uppercaseTokens.has(lower)) return lower.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

export function formatRepositoryLabel(repositoryUrl: string) {
  const match = repositoryUrl.match(/github\.com\/([^\/]+\/[^\/?#]+)/i);
  return match ? match[1] : repositoryUrl;
}

export function rankRelatedItems(current: ExampleItem, items: ExampleItem[]) {
  return items
    .filter((item) => item.type !== current.type || item.slug !== current.slug)
    .map((item) => ({
      item,
      score: getSuggestionScore(current, item),
      sortName: normalizeForMatch(item.name),
      sortSlug: normalizeForMatch(item.slug),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      if (a.sortName !== b.sortName) {
        return a.sortName.localeCompare(b.sortName);
      }

      return a.sortSlug.localeCompare(b.sortSlug);
    })
    .slice(0, 3)
    .map(({ item }) => item);
}

function normalizeForMatch(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

function getSuggestionScore(current: ExampleItem, candidate: ExampleItem) {
  let score = 0;

  const currentCategory = normalizeForMatch(current.category);
  const candidateCategory = normalizeForMatch(candidate.category);
  if (currentCategory && currentCategory === candidateCategory) {
    score += 10;
  }

  const currentTags = new Set(
    (current.tags ?? []).map((tag) => normalizeForMatch(tag)).filter(Boolean)
  );
  const candidateTags = new Set(
    (candidate.tags ?? []).map((tag) => normalizeForMatch(tag)).filter(Boolean)
  );

  let sharedTagCount = 0;
  for (const tag of candidateTags) {
    if (currentTags.has(tag)) {
      sharedTagCount += 1;
    }
  }

  score += Math.min(sharedTagCount * 2, 6);

  const currentPrimaryTag = normalizeForMatch(current.primaryFilterTag);
  const candidatePrimaryTag = normalizeForMatch(candidate.primaryFilterTag);
  if (currentPrimaryTag && currentPrimaryTag === candidatePrimaryTag) {
    score += 1;
  }

  return score;
}
