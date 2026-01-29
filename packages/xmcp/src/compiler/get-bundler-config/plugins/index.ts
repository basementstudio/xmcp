import { adapterOutputPath, runtimeFolderPath } from "@/utils/constants";
import fs from "fs-extra";
import path from "path";
import { Compiler } from "@rspack/core";
import { XmcpConfigOutputSchema } from "@/compiler/config";
import { getXmcpConfig } from "@/compiler/compiler-context";
import {
  cloudflareTypeDefinition,
  expressTypeDefinition,
  nestJsTypeDefinition,
  nextJsTypeDefinition,
} from "./types";

/**
 * Read all client bundles from disk for Cloudflare injection.
 * Returns a record mapping bundle names to their JS and CSS contents.
 */
export function readClientBundlesFromDisk(): Record<
  string,
  { js: string; css?: string }
> {
  const bundles: Record<string, { js: string; css?: string }> = {};
  const clientDir = path.join(process.cwd(), "dist", "client");

  if (!fs.existsSync(clientDir)) {
    return bundles;
  }

  const files = fs.readdirSync(clientDir);
  const jsFiles = files.filter((f) => f.endsWith(".bundle.js"));

  for (const jsFile of jsFiles) {
    const bundleName = jsFile.replace(".bundle.js", "");
    const jsPath = path.join(clientDir, jsFile);
    const cssPath = path.join(clientDir, `${bundleName}.bundle.css`);

    const js = fs.readFileSync(jsPath, "utf-8");
    let css: string | undefined;

    if (fs.existsSync(cssPath)) {
      css = fs.readFileSync(cssPath, "utf-8");
    }

    bundles[bundleName] = { js, css };
  }

  return bundles;
}

// @ts-expect-error: injected by compiler
export const runtimeFiles = RUNTIME_FILES as Record<string, string>;

/**
 * Determines which runtime files are needed based on user configuration.
 */
function getNeededRuntimeFiles(xmcpConfig: XmcpConfigOutputSchema): string[] {
  const neededFiles: string[] = [];

  // headers included if http is configured
  if (xmcpConfig.http) {
    neededFiles.push("headers.js");
  }

  if (xmcpConfig.stdio) {
    neededFiles.push("stdio.js");
  }

  if (xmcpConfig.http) {
    if (xmcpConfig.experimental?.adapter === "express") {
      neededFiles.push("adapter-express.js");
    } else if (xmcpConfig.experimental?.adapter === "nextjs") {
      neededFiles.push("adapter-nextjs.js");
    } else if (xmcpConfig.experimental?.adapter === "cloudflare") {
      // Cloudflare adapter is built from source, not copied from pre-built
      // So we don't push any file here - it's handled in get-entries.ts
    } else if (xmcpConfig.experimental?.adapter === "nestjs") {
      neededFiles.push("adapter-nestjs.js");
    } else {
      neededFiles.push("http.js");
    }
  }

  return neededFiles;
}

export class InjectRuntimePlugin {
  apply(compiler: Compiler) {
    let hasRun = false;
    compiler.hooks.beforeCompile.tap(
      "InjectRuntimePlugin",
      (_compilationParams) => {
        if (hasRun) return;
        hasRun = true;

        const xmcpConfig = getXmcpConfig();
        const neededFiles = getNeededRuntimeFiles(xmcpConfig);

        for (const [fileName, fileContent] of Object.entries(runtimeFiles)) {
          if (neededFiles.includes(fileName)) {
            fs.writeFileSync(
              path.join(runtimeFolderPath, fileName),
              fileContent
            );
          }
        }
      }
    );
  }
}

export class CreateTypeDefinitionPlugin {
  apply(compiler: Compiler) {
    let hasRun = false;
    compiler.hooks.afterEmit.tap(
      "CreateTypeDefinitionPlugin",
      (_compilationParams) => {
        if (hasRun) return;
        hasRun = true;

        const xmcpConfig = getXmcpConfig();

        // Manually type the .xmcp/adapter/index.js file using a .xmcp/adapter/index.d.ts file
        if (xmcpConfig.experimental?.adapter) {
          let typeDefinitionContent = "";
          if (xmcpConfig.experimental?.adapter == "nextjs") {
            typeDefinitionContent = nextJsTypeDefinition;
          } else if (xmcpConfig.experimental?.adapter == "express") {
            typeDefinitionContent = expressTypeDefinition;
          } else if (xmcpConfig.experimental?.adapter == "cloudflare") {
            typeDefinitionContent = cloudflareTypeDefinition;
          } else if (xmcpConfig.experimental?.adapter == "nestjs") {
            typeDefinitionContent = nestJsTypeDefinition;
          }
          fs.writeFileSync(
            path.join(adapterOutputPath, "index.d.ts"),
            typeDefinitionContent
          );
        }
      }
    );
  }
}
