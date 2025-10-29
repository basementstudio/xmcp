/**
 * Check if a file path is a React component (.tsx file)
 */
export function isReactFile(filePath: string): boolean {
  return filePath.endsWith(".tsx");
}
