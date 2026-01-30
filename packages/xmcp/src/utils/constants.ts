import path from "path";
import { createRequire } from "module";

export const runtimeFolder = ".xmcp";
export const runtimeFolderPath = path.join(process.cwd(), runtimeFolder);
export const rootFolder = path.join(process.cwd());

export const processFolder = process.cwd();
export const distOutputPath = path.join(processFolder, "dist");
export const adapterOutputPath = path.join(runtimeFolderPath, "adapter");
export const cloudflareOutputPath = path.join(runtimeFolderPath, "cloudflare");

/**
 * Resolve the absolute path to the `xmcp` package `src/` folder.
 *
 * Used when we need to bundle TypeScript source from xmcp itself
 * (e.g. Cloudflare adapter builds).
 */
export function resolveXmcpSrcPath(): string {
  try {
    const req = createRequire(path.join(process.cwd(), "package.json"));
    const pkgJsonPath = req.resolve("xmcp/package.json");
    return path.join(path.dirname(pkgJsonPath), "src");
  } catch (error) {
    throw new Error(
      `Could not resolve xmcp source path. ` +
        `Make sure the \"xmcp\" package is resolvable from your project.\n` +
        `Original error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
