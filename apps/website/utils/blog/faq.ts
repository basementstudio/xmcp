import type { FaqItem } from "@/lib/structured-data";

const FAQ_HEADING = "Common questions";
const FAQ_ANCHOR = "#common-questions";

interface TocEntry {
  readonly depth: number;
  readonly url: string;
}

function plainText(markdown: string): string {
  return markdown
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function faqSection(content: string): string | undefined {
  const afterHeading = content.split(`\n## ${FAQ_HEADING}\n`)[1];
  return afterHeading?.split(/\n## /)[0];
}

function questionAnchors(toc: readonly TocEntry[]): string[] {
  const start = toc.findIndex(
    (entry) => entry.depth === 2 && entry.url === FAQ_ANCHOR
  );
  if (start === -1) return [];
  const following = toc.slice(start + 1);
  const end = following.findIndex((entry) => entry.depth <= 2);
  const questions = end === -1 ? following : following.slice(0, end);
  return questions
    .filter((entry) => entry.depth === 3)
    .map((entry) => entry.url.slice(1));
}

export function getPostFaqItems(
  content: string,
  toc: readonly TocEntry[]
): FaqItem[] {
  const section = faqSection(content);
  if (!section) return [];
  const anchors = questionAnchors(toc);
  return section
    .split(/\n### /)
    .slice(1)
    .flatMap((entry, index) => {
      const [question, ...answer] = entry.split("\n");
      const slug = anchors[index];
      return slug
        ? [
            {
              slug,
              question: plainText(question),
              answer: plainText(answer.join("\n")),
            },
          ]
        : [];
    });
}
