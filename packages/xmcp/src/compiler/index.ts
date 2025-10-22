import { webpack } from "webpack";
import { getWebpackConfig } from "./get-webpack-config";
import chalk from "chalk";
import { getConfig } from "./parse-xmcp-config";
import {
  generateImportCode,
  generateClientBundlesCode,
} from "./generate-import-code";
import {
  generateToolsExportCode,
  generateToolsTypesCode,
} from "./generate-tools-code";
import fs from "fs";
import { rootFolder, runtimeFolderPath } from "@/utils/constants";
import { createFolder } from "@/utils/fs-utils";
import path from "path";
import { deleteSync } from "del";
import dotenv from "dotenv";
export { type Middleware } from "@/types/middleware";
import { generateEnvCode } from "./generate-env-code";
import { Watcher } from "@/utils/file-watcher";
import { onFirstBuild } from "./on-first-build";
import { greenCheck } from "@/utils/cli-icons";
import { compilerContext } from "./compiler-context";
import { startHttpServer } from "./start-http-server";
import { isValidPath } from "@/utils/path-validation";
import { getResolvedPathsConfig } from "./config/utils";
import { pathToToolName } from "./utils/path-utils";
import { transpileClientComponent } from "./transpile-client-components";
dotenv.config();

export type CompilerMode = "development" | "production";

export interface CompileOptions {
  onBuild?: () => void;
}

export async function compile({ onBuild }: CompileOptions = {}) {
  const { mode, toolPaths, promptPaths, resourcePaths } =
    compilerContext.getContext();
  const startTime = Date.now();
  let compilerStarted = false;

  const xmcpConfig = await getConfig();
  compilerContext.setContext({
    xmcpConfig: xmcpConfig,
  });
  let webpackConfig = getWebpackConfig(xmcpConfig);

  if (xmcpConfig.webpack) {
    webpackConfig = xmcpConfig.webpack(webpackConfig);
  }

  const watcher = new Watcher({
    // keep the watcher running on dev mode after "onReady"
    persistent: mode === "development",
    ignored: /(^|[\/\\])\../,
    ignoreInitial: false,
  });

  // handle tools
  let toolsPath = isValidPath(
    getResolvedPathsConfig(xmcpConfig).tools,
    "tools"
  );

  // handle tools
  if (toolsPath) {
    watcher.watch(`${toolsPath}/**/*.{ts,tsx}`, {
      onAdd: (path) => {
        toolPaths.add(path);
        if (compilerStarted) {
          generateCode();
        }
      },
      onUnlink: (path) => {
        toolPaths.delete(path);
        if (compilerStarted) {
          generateCode();
        }
      },
    });
  }

  // handle prompts
  let promptsPath = isValidPath(
    getResolvedPathsConfig(xmcpConfig).prompts,
    "prompts"
  );

  // handle prompts
  if (promptsPath) {
    watcher.watch(`${promptsPath}/**/*.{ts,tsx}`, {
      onAdd: (path) => {
        promptPaths.add(path);
        if (compilerStarted) {
          generateCode();
        }
      },
      onUnlink: (path) => {
        promptPaths.delete(path);
        if (compilerStarted) {
          generateCode();
        }
      },
    });
  }

  // handle resources
  let resourcesPath = isValidPath(
    getResolvedPathsConfig(xmcpConfig).resources,
    "resources"
  );

  // handle resources
  if (resourcesPath) {
    watcher.watch(`${resourcesPath}/**/*.{ts,tsx}`, {
      onAdd: (path) => {
        resourcePaths.add(path);
        if (compilerStarted) {
          generateCode();
        }
      },
      onUnlink: (path) => {
        resourcePaths.delete(path);
        if (compilerStarted) {
          generateCode();
        }
      },
    });
  }

  // if adapter is not enabled, handle middleware
  if (!xmcpConfig.experimental?.adapter) {
    // handle middleware
    watcher.watch("./src/middleware.ts", {
      onAdd: () => {
        compilerContext.setContext({
          hasMiddleware: true,
        });
        if (compilerStarted) {
          generateCode();
        }
      },
      onUnlink: () => {
        compilerContext.setContext({
          hasMiddleware: false,
        });
        if (compilerStarted) {
          generateCode();
        }
      },
    });
  }

  // start compiler
  watcher.onReady(() => {
    let firstBuild = true;
    compilerStarted = true;

    // delete existing runtime folder
    deleteSync(runtimeFolderPath);
    createFolder(runtimeFolderPath);

    generateCode();

    webpack(webpackConfig, (err, stats) => {
      if (err) {
        console.error(err);
        return;
      }

      if (stats?.hasErrors()) {
        console.error(
          stats.toString({
            colors: true,
            chunks: false,
          })
        );
        return;
      }

      (async () => {
        if (xmcpConfig.experimental?.ssr === true) {
          const clientBundles = new Map<string, string>();

          for (const path of toolPaths) {
            if (path.endsWith(".tsx")) {
              const toolName = pathToToolName(path);
              const bundlePath = `dist/client/${toolName}.bundle.js`;

              await transpileClientComponent(path, toolName, "dist/client");
              clientBundles.set(toolName, bundlePath);
            }
          }

          compilerContext.setContext({ clientBundles });
        }

        if (firstBuild) {
          onFirstBuild(mode, xmcpConfig);
          // user defined callback
          onBuild?.();
        } else {
          // on dev mode, webpack will recompile the code, so we need to start the http server after the first one
          if (
            mode === "development" &&
            xmcpConfig["http"] &&
            !xmcpConfig.experimental?.adapter
          ) {
            startHttpServer();
          }
        }

        // Track compilation time for all builds
        let compilationTime: number;
        if (stats?.endTime && stats?.startTime) {
          compilationTime = stats.endTime - stats.startTime;
        } else {
          compilationTime = Date.now() - startTime;
        }

        // Choose color based on compilation time
        let timeColor = (str: string) => str;
        if (mode === "development") {
          if (compilationTime > 1000) {
            timeColor = chalk.bold.red;
          } else if (compilationTime > 500) {
            timeColor = chalk.bold.yellow;
          }
        }

        console.log(
          `${greenCheck} Compiled in ${timeColor(`${compilationTime}ms`)}`
        );

        firstBuild = false;
      })();
      // Compiler callback ends
    });
  });
}

function generateCode() {
  const fileContent = generateImportCode();
  fs.writeFileSync(path.join(runtimeFolderPath, "import-map.js"), fileContent);

  // Append client bundles mapping if SSR is enabled
  const { clientBundles } = compilerContext.getContext();
  if (clientBundles && clientBundles.size > 0) {
    const bundlesCode = generateClientBundlesCode(clientBundles);
    fs.appendFileSync(
      path.join(runtimeFolderPath, "import-map.js"),
      bundlesCode
    );
  }

  // Generate runtime exports for global access
  const runtimeExportsCode = generateEnvCode();
  const envFilePath = path.join(rootFolder, "xmcp-env.d.ts");

  // Delete existing file if it exists
  if (fs.existsSync(envFilePath)) {
    fs.unlinkSync(envFilePath);
  }

  fs.writeFileSync(envFilePath, runtimeExportsCode);

  // only generating tools files for nextjs adapter mode
  const { xmcpConfig } = compilerContext.getContext();
  if (xmcpConfig?.experimental?.adapter === "nextjs") {
    const toolsCode = generateToolsExportCode();
    fs.writeFileSync(path.join(runtimeFolderPath, "tools.js"), toolsCode);
    const typesCode = generateToolsTypesCode();
    fs.writeFileSync(path.join(runtimeFolderPath, "tools.d.ts"), typesCode);
  }
}
