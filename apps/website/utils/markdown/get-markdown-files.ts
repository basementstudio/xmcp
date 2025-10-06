import fs from "fs";
import path from "path";
import {
  DOCS_DIRECTORY,
  extractOrderFromFilename,
  generateTitleFromFilename,
  generateSlugFromPath,
} from "./utils";

export interface MarkdownFileInfo {
  slug: string;
  title: string;
  path: string;
  order: number;
}

export function getMarkdownFileSlugs(): MarkdownFileInfo[] {
  const files: MarkdownFileInfo[] = [];

  function readDirectory(dir: string, basePath = ""): void {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        const { cleanName: cleanDirName } = extractOrderFromFilename(item);
        readDirectory(itemPath, path.join(basePath, cleanDirName));
      } else if (item.endsWith(".mdx")) {
        const { order } = extractOrderFromFilename(item);
        const slug = generateSlugFromPath(basePath, item);
        const title = generateTitleFromFilename(item);

        files.push({
          slug,
          title,
          path: itemPath,
          order,
        });
      }
    }
  }

  if (fs.existsSync(DOCS_DIRECTORY)) {
    readDirectory(DOCS_DIRECTORY);
  }

  return files;
}

export function getMarkdownFileSlugByPath(filePath: string): string | null {
  const files = getMarkdownFileSlugs();
  const normalizedPath = path.resolve(filePath);

  const found = files.find((file) => file.path === normalizedPath);
  return found ? found.slug : null;
}
