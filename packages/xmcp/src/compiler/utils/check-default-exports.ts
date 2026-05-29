import fs from "node:fs";
import path from "node:path";

const EXPORT_DEFAULT_RE = /^export\s+default\b/m;

export function findMissingDefaultExports(
  paths: Set<string>,
  cwd: string
): string[] {
  const missing: string[] = [];
  for (const filePath of paths) {
    let content: string;
    try {
      content = fs.readFileSync(path.join(cwd, filePath), "utf8");
    } catch {
      continue;
    }
    if (!EXPORT_DEFAULT_RE.test(content)) {
      missing.push(filePath);
    }
  }
  return missing;
}
