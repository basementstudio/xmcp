import path from "path";

export const DOCS_DIRECTORY = path.join(process.cwd(), "src/docs");

// Extract numeric prefix from filename (e.g., "01-introduction.mdx" -> { order: 1, cleanName: "introduction" })
export function extractOrderFromFilename(filename: string): {
  order: number;
  cleanName: string;
} {
  const match = filename.match(/^(\d+)[-_](.+)$/);
  if (match) {
    return {
      order: parseInt(match[1], 10),
      cleanName: match[2],
    };
  }
  return {
    order: 999,
    cleanName: filename,
  };
}

export function isIndexFile(filename: string): boolean {
  const { cleanName } = extractOrderFromFilename(filename);
  return cleanName.replace(/\.(md|mdx)$/, "") === "index";
}

export function generateTitleFromFilename(filename: string): string {
  const { cleanName } = extractOrderFromFilename(filename);
  const nameWithoutExtension = cleanName.replace(/\.(md|mdx)$/, "");
  return nameWithoutExtension
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function generateSlugFromPath(
  basePath: string,
  filename: string
): string {
  const { cleanName } = extractOrderFromFilename(filename);

  let rawSlug: string;
  if (isIndexFile(filename)) {
    // For root-level index files, use "index" as the slug
    rawSlug = basePath === "" ? "index" : basePath;
  } else {
    rawSlug = path.join(basePath, cleanName.replace(/\.mdx$/, ""));
  }

  return rawSlug.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
}
