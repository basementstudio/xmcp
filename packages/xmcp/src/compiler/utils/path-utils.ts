import assert from "node:assert";
import { sep, normalize } from "node:path";
import { createHash } from "node:crypto";

export function pathToToolName(path: string): string {
  const normalizedPath = normalize(path).split(sep).join("/");
  const parts = normalizedPath.split("/");

  const toolsIndex = parts.findIndex((part) => part === "tools");

  assert(
    toolsIndex !== -1,
    `Invalid tool path: "${path}" does not contain "tools" directory`
  );

  const pathAfterTools = parts.slice(toolsIndex + 1).join("/");

  assert(
    pathAfterTools !== "",
    `Invalid tool path: "${path}" has no filename after "tools" directory`
  );

  const withoutExtension = pathAfterTools.replace(/\.[^/.]+$/, "");

  const baseName = withoutExtension.replace(/\//g, "-");

  const hash = createHash("md5")
    .update(pathAfterTools)
    .digest("hex")
    .slice(0, 6);

  return `${baseName}-${hash}`;
}
