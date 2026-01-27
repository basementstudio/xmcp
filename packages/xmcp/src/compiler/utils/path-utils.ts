import { compilerContext } from "../compiler-context";
import {
  pathToToolNameMd5,
  pathToToolNameDjb2,
} from "@/runtime/utils/path-to-tool-name";

/**
 * Get the appropriate pathToToolName function based on target platform.
 * - For Cloudflare: Use djb2 hash
 * - For Node.js (express, nextjs, etc.): Use MD5 hash
 */
export function pathToToolName(path: string): string {
  try {
    const { platforms } = compilerContext.getContext();
    if (platforms?.cloudflare) {
      return pathToToolNameDjb2(path);
    }
  } catch {
    // Context not available, use default (MD5)
  }
  return pathToToolNameMd5(path);
}
