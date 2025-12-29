import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { source } from "@/lib/source";

export function cleanId(id: string) {
  return id.replace(/^\/docs\/?/, "").replace(/-\d+$/, "");
}

export async function getPageContent(slugs: string[]) {
  const page = source.getPage(slugs);
  if (!page) return null;

  const filePath = slugs.length ? `${slugs.join("/")}.mdx` : "index.mdx";
  const docsDir = path.join(process.cwd(), "content/docs");
  const mdxPath = path.join(docsDir, filePath);

  const resolvedPath = path.resolve(mdxPath);
  const resolvedDocsDir = path.resolve(docsDir);
  if (!resolvedPath.startsWith(resolvedDocsDir)) {
    return null;
  }

  try {
    const content = await fsPromises.readFile(mdxPath, "utf-8");

    return {
      title: page.data.title,
      description: page.data.description,
      content,
    };
  } catch {
    return null;
  }
}

export interface DocsFrontmatter {
  readonly title?: string;
  readonly description?: string;
  readonly summary?: string;
  readonly metadataTitle?: string;
  readonly publishedAt?: string;
  readonly [key: string]: unknown;
}

export interface DocsPage {
  readonly slug: string;
  readonly title: string;
  readonly content: string;
  readonly data: DocsFrontmatter;
  readonly path: string;
  readonly description?: string;
  readonly summary?: string;
}

export interface DocsMetadata {
  readonly title: string;
  readonly description: string;
  readonly summary: string | undefined;
  readonly ogImageUrl: string;
}

export const DOCS_DIRECTORY = path.join(process.cwd(), "content/docs");

/**
 * Get a docs page by its slug, reading the MDX file directly with gray-matter
 * to extract all frontmatter fields including custom ones like summary.
 */
export function getDocsPageBySlug(slug: string[] | undefined): DocsPage | null {
  const slugPath = slug ? slug.join("/") : "index";
  const filePath = path.join(DOCS_DIRECTORY, `${slugPath}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContent);

  return {
    slug: slugPath,
    title: data.title || slugPath,
    content,
    data: data as DocsFrontmatter,
    path: filePath,
    description: data.description,
    summary: data.summary,
  };
}

/**
 * Get metadata for a docs page, suitable for generating page metadata and OG images.
 */
export function getDocsMetadata(
  slug: string[] | undefined,
  baseUrl: string
): DocsMetadata | null {
  const page = source.getPage(slug);
  if (!page) return null;

  const docsPage = getDocsPageBySlug(slug);
  const slugPath = slug?.join("/") ?? "";

  return {
    title: page.data.title,
    description: docsPage?.description ?? page.data.description ?? "",
    summary: docsPage?.summary,
    ogImageUrl: `${baseUrl}/api/og/docs/${slugPath}`,
  };
}
