import { runtimeFolderPath } from "@/utils/constants";
import { XmcpConfigOutputSchema } from "@/compiler/config";
import path from "path";

/**
 * Get the path to the xmcp source directory.
 * Works both in development (when running from source) and production (when installed as npm package).
 */
function getXmcpSrcPath(): string {
  // The path to xmcp is injected at build time via DefinePlugin
  // @ts-expect-error: injected by compiler
  if (typeof XMCP_SRC_PATH === "string") {
    // @ts-expect-error: injected by compiler
    return XMCP_SRC_PATH;
  }
  // Fallback for development - resolve from __dirname
  return path.resolve(__dirname, "..", "..");
}

/** Get what packages are gonna be built by xmcp */
export function getEntries(
  xmcpConfig: XmcpConfigOutputSchema
): Record<string, string> {
  const entries: Record<string, string> = {};
  if (xmcpConfig.stdio) {
    entries.stdio = path.join(runtimeFolderPath, "stdio.js");
  }
  if (xmcpConfig["http"]) {
    // non adapter mode
    if (!xmcpConfig.experimental?.adapter) {
      entries["http"] = path.join(runtimeFolderPath, "http.js");
    }

    // adapter mode enabled
    if (xmcpConfig.experimental?.adapter === "express") {
      entries["adapter"] = path.join(runtimeFolderPath, "adapter-express.js");
    }
    if (xmcpConfig.experimental?.adapter === "nextjs") {
      entries["adapter"] = path.join(runtimeFolderPath, "adapter-nextjs.js");
    }
    if (xmcpConfig.experimental?.adapter === "cloudflare") {
      // Cloudflare adapter is built from TypeScript source (not pre-built)
      // This allows proper webworker target compilation with all dependencies bundled
      const xmcpSrcPath = getXmcpSrcPath();
      entries["adapter"] = path.join(
        xmcpSrcPath,
        "runtime/adapters/cloudflare/index.ts"
      );
    }
    if (xmcpConfig.experimental?.adapter === "nestjs") {
      entries["adapter"] = path.join(runtimeFolderPath, "adapter-nestjs.js");
    }
  }
  return entries;
}
