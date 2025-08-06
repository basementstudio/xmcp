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
export { type XmcpMiddleware } from "@/types/middleware";
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
  const { mode, toolPaths } = compilerContext.getContext();
  const startTime = Date.now();
  let compilerStarted = false;

  const xmpcConfig = await getConfig();
  compilerContext.setContext({
    xmcpConfig: xmpcConfig,
  });
  let webpackConfig = getWebpackConfig(xmpcConfig);

  if (xmpcConfig.webpack) {
    webpackConfig = xmpcConfig.webpack(webpackConfig);
  }

  const watcher = new Watcher({
    // keep the watcher running on dev mode after "onReady"
    persistent: mode === "development",
    ignored: /(^|[\/\\])\../,
    ignoreInitial: false,
  });

  let toolsPath = isValidPath(
    getResolvedPathsConfig(xmpcConfig).tools,
    "tools"
  );

  // handle tools
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

  // if adapter is not enabled, handle middleware
  if (!xmpcConfig.experimental?.adapter) {
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
        firstBuild = false;
        const endTime = Date.now();
        const duration = endTime - startTime;
        console.log(
          `${greenCheck} Compiled in ${chalk.bold.green(`${duration}ms`)}`
        );
        onFirstBuild(mode, xmpcConfig);
        // user defined callback
        onBuild?.();
      } else {
        // on dev mode, webpack will recompile the code, so we need to start the http server after the first one
        if (
          mode === "development" &&
          xmpcConfig["http"] &&
          !xmpcConfig.experimental?.adapter
        ) {
          startHttpServer();
        }
      }
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
