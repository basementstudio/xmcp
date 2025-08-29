import path from "path";
import fs from "fs";
import matter from "gray-matter";
import {
  extractOrderFromFilename,
  generateTitleFromFilename,
  generateSlugFromPath,
} from "./utils";

export const LEARN_DIRECTORY = path.join(process.cwd(), "src/learn");

export interface LearnMarkdownFile {
  slug: string;
  title: string;
  content: string;
  data: {
    title?: string;
    description?: string;
    order?: number;
    [key: string]: unknown;
  };
  path: string;
  order: number;
}

export function getAllLearnMarkdownFiles(): LearnMarkdownFile[] {
  const files: LearnMarkdownFile[] = [];

  function readDirectory(dir: string, basePath = ""): void {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        const { cleanName: cleanDirName } = extractOrderFromFilename(item);
        readDirectory(itemPath, path.join(basePath, cleanDirName));
      } else if (item.endsWith(".mdx")) {
        const fileContent = fs.readFileSync(itemPath, "utf8");
        const { data, content } = matter(fileContent);

        const { order } = extractOrderFromFilename(item);
        const slug = generateSlugFromPath(basePath, item);
        const title = data.title || generateTitleFromFilename(item);

        files.push({
          slug,
          title,
          content,
          data,
          path: itemPath,
          order: data.order || order,
        });
      }
    }
  }

  if (fs.existsSync(LEARN_DIRECTORY)) {
    readDirectory(LEARN_DIRECTORY);
  }

  return files;
}

export function getLearnMarkdownFileBySlug(
  slug: string
): LearnMarkdownFile | null {
  const files = getAllLearnMarkdownFiles();
  return files.find((file) => file.slug === slug) || null;
}

export function getLearnMarkdownFileSlugs() {
  const files = getAllLearnMarkdownFiles();
  return files.map((file) => ({
    slug: file.slug,
    title: file.title,
    path: file.path,
    order: file.order,
  }));
}
