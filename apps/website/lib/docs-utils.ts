import { source } from "@/lib/source";
import fs from "fs/promises";
import path from "path";

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
    const content = await fs.readFile(mdxPath, "utf-8");

    return {
      title: page.data.title,
      description: page.data.description,
      content,
    };
  } catch {
    return null;
  }
}
