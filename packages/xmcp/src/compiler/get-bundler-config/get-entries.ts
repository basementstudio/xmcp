import { runtimeFolderPath, resolveXmcpSrcPath } from "@/utils/constants";
import { XmcpConfigOutputSchema } from "@/compiler/config";
import path from "path";
import { compilerContext } from "@/compiler/compiler-context";

/** Get what packages are gonna be built by xmcp */
export function getEntries(
  xmcpConfig: XmcpConfigOutputSchema
): Record<string, string> {
  const { platforms } = compilerContext.getContext();

  if (platforms.cloudflare) {
    const xmcpSrcPath = resolveXmcpSrcPath();
    return {
      worker: path.join(xmcpSrcPath, "runtime/platforms/cloudflare/worker.ts"),
    };
  }

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
    if (xmcpConfig.experimental?.adapter === "nestjs") {
      entries["adapter"] = path.join(runtimeFolderPath, "adapter-nestjs.js");
    }
  }
  return entries;
}
