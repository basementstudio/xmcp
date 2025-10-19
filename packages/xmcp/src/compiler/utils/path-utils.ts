export function pathToToolName(path: string): string {
  const fileName = path.split("/").pop() || path;
  return fileName.replace(/\.[^/.]+$/, "");
}
