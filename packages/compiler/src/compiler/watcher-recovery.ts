import path from "path";
import fs from "fs";

function normalizeSlashes(value: string): string {
  return value.replace(/\\/g, "/");
}

function stripLeadingDotSlash(value: string): string {
  return value.replace(/^\.\//, "");
}

export function toProjectRelativePath(
  filePath: string,
  cwd: string = process.cwd()
): string {
  const relativePath = path.isAbsolute(filePath)
    ? path.relative(cwd, filePath)
    : filePath;

  return stripLeadingDotSlash(normalizeSlashes(relativePath));
}

export function addWatchedPath(
  pathSet: Set<string>,
  filePath: string,
  cwd: string = process.cwd()
) {
  pathSet.add(toProjectRelativePath(filePath, cwd));
}

export function removeWatchedPath(
  pathSet: Set<string>,
  filePath: string,
  cwd: string = process.cwd()
) {
  const normalizedRawPath = stripLeadingDotSlash(normalizeSlashes(filePath));
  const normalizedRelativePath = toProjectRelativePath(filePath, cwd);

  const normalizedCandidates = new Set<string>([
    normalizedRawPath,
    normalizedRelativePath,
  ]);

  for (const currentPath of Array.from(pathSet)) {
    const normalizedCurrentPath = stripLeadingDotSlash(
      normalizeSlashes(currentPath)
    );

    if (normalizedCandidates.has(normalizedCurrentPath)) {
      pathSet.delete(currentPath);
    }
  }
}

export function pruneMissingWatchedPaths(
  pathSet: Set<string>,
  cwd: string = process.cwd()
): boolean {
  let removed = false;

  for (const currentPath of Array.from(pathSet)) {
    const normalized = stripLeadingDotSlash(normalizeSlashes(currentPath));
    const absolutePath = path.resolve(cwd, normalized);

    if (!fs.existsSync(absolutePath)) {
      pathSet.delete(currentPath);
      removed = true;
    }
  }

  return removed;
}
