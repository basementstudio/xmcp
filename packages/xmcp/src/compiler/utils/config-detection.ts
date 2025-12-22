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
