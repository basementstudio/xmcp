import type { TemplateItem } from "./github";
import { isTypeLabel } from "./detail";

export function collectUniqueCategories(templates: TemplateItem[]): string[] {
  const seen = new Map<string, string>();
  for (const template of templates) {
    const label = template.primaryFilterTag ?? template.category;
    if (!label) continue;
    const trimmed = label.trim();
    if (trimmed.length === 0 || isTypeLabel(trimmed)) continue;
    const key = trimmed.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, trimmed);
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
}
