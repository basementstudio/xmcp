import { webpack } from "webpack";
import { getWebpackConfig } from "./get-webpack-config";
import chalk from "chalk";
import { getConfig } from "./parse-xmcp-config";
import { generateImportCode } from "./generate-import-code";
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
import {
  telemetry,
  TelemetryEventName,
  TransportType,
  AdapterType,
  ErrorPhase,
} from "../telemetry";
import { isReactFile } from "../runtime/utils/react";
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
      onAdd: async (path) => {
        toolPaths.add(path);
        if (compilerStarted) {
          await generateCode();
        }
      },
      onUnlink: async (path) => {
        toolPaths.delete(path);
        if (compilerStarted) {
          await generateCode();
        }
      },
      onChange: async (changedPath) => {
        if (compilerStarted) {
          await generateCode();
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
      onAdd: async (path) => {
        promptPaths.add(path);
        if (compilerStarted) {
          await generateCode();
        }
      },
      onUnlink: async (path) => {
        promptPaths.delete(path);
        if (compilerStarted) {
          await generateCode();
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
      onAdd: async (path) => {
        resourcePaths.add(path);
        if (compilerStarted) {
          await generateCode();
        }
      },
      onUnlink: async (path) => {
        resourcePaths.delete(path);
        if (compilerStarted) {
          await generateCode();
        }
      },
    });
  }

  // if adapter is not enabled, handle middleware
  if (!xmcpConfig.experimental?.adapter) {
    // handle middleware
    watcher.watch("./src/middleware.ts", {
      onAdd: async () => {
        compilerContext.setContext({
          hasMiddleware: true,
        });
        if (compilerStarted) {
          await generateCode();
        }
      },
      onUnlink: async () => {
        compilerContext.setContext({
          hasMiddleware: false,
        });
        if (compilerStarted) {
          await generateCode();
        }
      },
    });
  }

  // start compiler
  watcher.onReady(async () => {
    let firstBuild = true;
    compilerStarted = true;

    // delete existing runtime folder
    deleteSync(runtimeFolderPath);
    createFolder(runtimeFolderPath);

    // Generate all code (including client bundles) BEFORE webpack runs
    await generateCode();

    webpack(webpackConfig, async (err, stats) => {
      // Track compilation time
      let compilationTime: number;
      if (stats?.endTime && stats?.startTime) {
        compilationTime = stats.endTime - stats.startTime;
      } else {
        compilationTime = Date.now() - startTime;
      }

      // Handle errors
      if (err || stats?.hasErrors()) {
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
        }

        // Track failed build (only in production)
        if (mode === "production") {
          const reactToolsCount =
            Array.from(toolPaths).filter(isReactFile).length;

          telemetry.record(
            {
              eventName: TelemetryEventName.BUILD_FAILED,
              fields: {
                success: false,
                duration: compilationTime,
                errorPhase: ErrorPhase.WEBPACK,
                errorType: err ? err.constructor.name : "WebpackError",
                toolsCount: toolPaths.size,
                reactToolsCount,
                promptsCount: promptPaths.size,
                resourcesCount: resourcePaths.size,
                transport: xmcpConfig.http
                  ? TransportType.HTTP
                  : TransportType.STDIO,
                adapter: xmcpConfig.experimental?.adapter
                  ? (xmcpConfig.experimental.adapter as AdapterType)
                  : AdapterType.NONE,
                nodeVersion: process.version,
                xmcpVersion: require("../../package.json").version,
              },
            },
            true // deferred - we'll use flushDetached
          );
          // Use flushDetached for faster process exit - spawns separate process
          telemetry.flushDetached("build");
        }

        return;
      }

      // Build succeeded
      if (firstBuild) {
        onFirstBuild(mode, xmcpConfig);

        // Track successful build (only in production)
        if (mode === "production") {
          const reactToolsCount =
            Array.from(toolPaths).filter(isReactFile).length;

          // Get output size
          let outputSize = 0;
          try {
            const distPath = path.join(process.cwd(), "dist");
            const fs = require("fs");
            if (fs.existsSync(distPath)) {
              const files = fs.readdirSync(distPath);
              files.forEach((file: string) => {
                const filePath = path.join(distPath, file);
                const stat = fs.statSync(filePath);
                if (stat.isFile()) {
                  outputSize += stat.size;
                }
              });
            }
          } catch (e) {
            // Ignore errors getting output size
          }

          telemetry.record(
            {
              eventName: TelemetryEventName.BUILD_COMPLETED,
              fields: {
                success: true,
                duration: compilationTime,
                toolsCount: toolPaths.size,
                reactToolsCount,
                promptsCount: promptPaths.size,
                resourcesCount: resourcePaths.size,
                outputSize,
                transport: xmcpConfig.http
                  ? TransportType.HTTP
                  : TransportType.STDIO,
                adapter: xmcpConfig.experimental?.adapter
                  ? (xmcpConfig.experimental.adapter as AdapterType)
                  : AdapterType.NONE,
                nodeVersion: process.version,
                xmcpVersion: require("../../package.json").version,
              },
            },
            true // deferred - we'll use flushDetached
          );
          // Use flushDetached for faster process exit - spawns separate process
          telemetry.flushDetached("build");
          // Telemetry runs in background detached process, build exits immediately
        }

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

/**
 * Builds client bundles for all React tool components (.tsx files)
 * Returns a map of tool names to their bundle paths
 */
async function buildClientBundles(): Promise<Map<string, string> | undefined> {
  const { toolPaths } = compilerContext.getContext();
  const reactToolPaths = Array.from(toolPaths).filter((toolPath) =>
    toolPath.endsWith(".tsx")
  );

  if (reactToolPaths.length === 0) {
    return undefined;
  }

  const clientBundles = new Map<string, string>();

  for (const reactToolPath of reactToolPaths) {
    const toolName = pathToToolName(reactToolPath);
    const bundlePath = `dist/client/${toolName}.bundle.js`;

    await transpileClientComponent(reactToolPath, toolName, "dist/client");
    clientBundles.set(toolName, bundlePath);
  }

  return clientBundles;
}

/**
 * Generates all runtime code and builds client bundles if needed
 * This centralizes all code generation logic including client bundle building
 */
async function generateCode() {
  // Build client bundles first (if there are React components)
  const clientBundles = await buildClientBundles();

  // Store in context for import map generation
  compilerContext.setContext({ clientBundles });

  // Generate import map code (includes client bundles)
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

  // only generating tools files for nextjs adapter mode
  const { xmcpConfig } = compilerContext.getContext();
  if (xmcpConfig?.experimental?.adapter === "nextjs") {
    const toolsCode = generateToolsExportCode();
    fs.writeFileSync(path.join(runtimeFolderPath, "tools.js"), toolsCode);
    const typesCode = generateToolsTypesCode();
    fs.writeFileSync(path.join(runtimeFolderPath, "tools.d.ts"), typesCode);
  }
}
