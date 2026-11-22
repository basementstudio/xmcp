import { blogSource, source } from "./source";
import { getBlogLLMText, getLLMText } from "./get-llm-text";

const BLOG_SECTION = "blog";
const PAGE_SEPARATOR = "\n\n";

export interface LLMSection {
  readonly name: string;
  readonly path: string;
  readonly text: string;
}

export function llmSectionFile(name: string): string {
  return `${name}.txt`;
}

function docsSectionNames(): string[] {
  const names = source
    .getPages()
    .map((page) => page.slugs[0])
    .filter((name): name is string => Boolean(name));
  return [...new Set(names)].sort();
}

async function docsSectionText(name: string): Promise<string> {
  const pages = source.getPages().filter((page) => page.slugs[0] === name);
  return (await Promise.all(pages.map(getLLMText))).join(PAGE_SEPARATOR);
}

async function blogSectionText(): Promise<string> {
  const posts = await Promise.all(blogSource.getPages().map(getBlogLLMText));
  return posts.join(PAGE_SEPARATOR);
}

export function llmSectionNames(): string[] {
  return [...docsSectionNames(), BLOG_SECTION];
}

export async function getLLMSection(name: string): Promise<LLMSection | null> {
  if (!llmSectionNames().includes(name)) return null;
  const text =
    name === BLOG_SECTION
      ? await blogSectionText()
      : await docsSectionText(name);
  return { name, path: `/llms-full/${llmSectionFile(name)}`, text };
}

export async function listLLMSections(): Promise<LLMSection[]> {
  const sections = await Promise.all(llmSectionNames().map(getLLMSection));
  return sections.filter((section): section is LLMSection => section !== null);
}
