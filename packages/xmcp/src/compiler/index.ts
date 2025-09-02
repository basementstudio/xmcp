import { webpack } from "webpack";
import { getWebpackConfig } from "./get-webpack-config";
import chalk from "chalk";
import { getConfig } from "./parse-xmcp-config";
import { generateImportCode } from "./generate-import-code";
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
dotenv.config();

export type CompilerMode = "development" | "production";

export interface CompileOptions {
  onBuild?: () => void;
}

export async function compile({ onBuild }: CompileOptions = {}) {
  const { mode, toolPaths, promptPaths } = compilerContext.getContext();
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
    watcher.watch(`${toolsPath}/**/*.ts`, {
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
    watcher.watch(`${promptsPath}/**/*.ts`, {
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
      // Compiler callback ends
    });
  });
}

function generateCode() {
  const fileContent = generateImportCode();
  fs.writeFileSync(path.join(runtimeFolderPath, "import-map.js"), fileContent);

  // Generate runtime exports for global access
  const runtimeExportsCode = generateEnvCode();
  const envFilePath = path.join(rootFolder, "xmcp-env.d.ts");

  // Delete existing file if it exists
  if (fs.existsSync(envFilePath)) {
    fs.unlinkSync(envFilePath);
  }

  fs.writeFileSync(envFilePath, runtimeExportsCode);
}
