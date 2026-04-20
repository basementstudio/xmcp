import type { ScanContext } from "../types";

export function fileInScope(ctx: ScanContext, absolutePath: string): boolean {
  if (!ctx.changedFiles) return true;
  return ctx.changedFiles.has(absolutePath);
}
