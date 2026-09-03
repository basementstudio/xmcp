import { runtimeFolderPath } from "@/utils/constants";
import { XmcpConfigOutputSchema } from "@/runtime-config";
import path from "path";
import { compilerContext } from "@/compiler/compiler-context";

/** Get what packages are gonna be built by xmcp */
export function getEntries(
  xmcpConfig: XmcpConfigOutputSchema
): Record<string, string> {
  const { platforms } = compilerContext.getContext();

  if (platforms.cloudflare) {
    // Prebuilt worker runtime copied into .xmcp by InjectRuntimePlugin
    return {
      worker: path.join(runtimeFolderPath, "cloudflare-worker.js"),
    };
  }

  const entries: Record<string, string> = {};
  if (xmcpConfig.stdio) {
    entries.stdio = path.join(runtimeFolderPath, "stdio.js");
  }
  if (xmcpConfig["http"]) {
    // non adapter mode
    if (!xmcpConfig.experimental?.adapter) {
      // Vercel serves the build as a function: it gets the runtime that
      // exports a handler, where a standalone deployment gets the one that
      // starts a server of its own.
      const entryName = platforms.vercel ? "vercel" : "http";
      entries[entryName] = path.join(runtimeFolderPath, `${entryName}.js`);
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
    if (xmcpConfig.experimental?.adapter === "fastify") {
      entries["adapter"] = path.join(runtimeFolderPath, "adapter-fastify.js");
    }
  }
  return entries;
}
