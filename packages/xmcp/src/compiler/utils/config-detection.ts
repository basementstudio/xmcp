import { join } from "node:path";
import { existsSync } from "node:fs";

export function hasPostCSSConfig(): boolean {
  const cwd = process.cwd();
  const configFiles = [
    "postcss.config.js",
    "postcss.config.mjs",
    "postcss.config.cjs",
    ".postcssrc",
    ".postcssrc.json",
    ".postcssrc.js",
  ];

  return configFiles.some((file) => existsSync(join(cwd, file)));
}

export function findGlobalsCss(): string | null {
  const cwd = process.cwd();
  const searchPaths = [
    "globals.css",
    "src/globals.css",
    "src/tools/globals.css",
  ];

  for (const relativePath of searchPaths) {
    const absolutePath = join(cwd, relativePath);
    if (existsSync(absolutePath)) {
      return absolutePath;
    }
  }

  return null;
}
