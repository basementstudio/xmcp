import assert from "node:assert";
import { sep, normalize } from "node:path";
import { createHash } from "node:crypto";

export function pathToToolName(path: string): string {
  const normalizedPath = normalize(path).split(sep).join("/");

  assert(normalizedPath !== "", `Invalid tool path: path is empty`);

  const withoutExtension = normalizedPath.replace(/\.[^/.]+$/, "");

  const baseName = withoutExtension.replace(/\//g, "_");

  const hash = createHash("md5")
    .update(normalizedPath)
    .digest("hex")
    .slice(0, 6);

  return `${baseName}_${hash}`;
}
