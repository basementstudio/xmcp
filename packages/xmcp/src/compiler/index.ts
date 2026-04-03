import { rspack } from "@rspack/core";
import { getRspackConfig } from "./get-bundler-config";
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
import { logBuildFailure, logBuildSuccess } from "./build-telemetry";
import { isValidPath } from "@/utils/path-validation";
import { getResolvedPathsConfig } from "./config/utils";
import { pathToToolName } from "./utils/path-utils";
import { transpileClientComponent } from "./client/transpile";
import { buildCloudflareOutput } from "../platforms/build-cloudflare-output";
import {
  addWatchedPath,
  removeWatchedPath,
} from "./watcher-recovery";
const { version: XMCP_VERSION } = require("../../package.json");
dotenv.config();

export type CompilerMode = "development" | "production";

export interface CompileOptions {
  onBuild?: () => void;
}

export async function compile({ onBuild }: CompileOptions = {}) {
  const { mode, toolPaths, promptPaths, resourcePaths, platforms } =
    compilerContext.getContext();
  const startTime = Date.now();
  let compilerStarted = false;

  const xmcpConfig = await getConfig();
  compilerContext.setContext({
    xmcpConfig: xmcpConfig,
  });
  const staleImportErrorSuppressions = new Map<string, number>();
  let bundlerConfig = getRspackConfig(xmcpConfig);
  let lastRestartedBuildHash: string | null = null;
  let restartInFlight: Promise<void> | null = null;

  const restartHttpServerSafely = async () => {
    if (restartInFlight) {
      return restartInFlight;
    }

    restartInFlight = (async () => {
      await startHttpServer();
    })();

    try {
      await restartInFlight;
    } finally {
      restartInFlight = null;
    }
  };

  if (xmcpConfig.bundler) {
    bundlerConfig = xmcpConfig.bundler(bundlerConfig);
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
      onAdd: async (filePath) => {
        addWatchedPath(toolPaths, filePath);
        if (compilerStarted) {
          await generateCode();
        }
      },
      onUnlink: async (filePath) => {
        removeWatchedPath(toolPaths, filePath);
        if (compilerStarted) {
          await generateCode();
        }
      },
      onChange: async () => {
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
      onAdd: async (filePath) => {
        addWatchedPath(promptPaths, filePath);
        if (compilerStarted) {
          await generateCode({ rebuildClientBundles: false });
        }
      },
      onChange: async () => {
        if (compilerStarted) {
          await generateCode({ rebuildClientBundles: false });
        }
      },
      onUnlink: async (filePath) => {
        removeWatchedPath(promptPaths, filePath);
        if (compilerStarted) {
          await generateCode({ rebuildClientBundles: false });
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
      onAdd: async (filePath) => {
        addWatchedPath(resourcePaths, filePath);
        if (compilerStarted) {
          await generateCode({ rebuildClientBundles: false });
        }
      },
      onChange: async () => {
        if (compilerStarted) {
          await generateCode({ rebuildClientBundles: false });
        }
      },
      onUnlink: async (filePath) => {
        removeWatchedPath(resourcePaths, filePath);
        if (compilerStarted) {
          await generateCode({ rebuildClientBundles: false });
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

    // Generate all code (including client bundles) BEFORE bundler runs
    await generateCode();

    rspack(bundlerConfig, async (err, stats) => {
      // Track compilation time
      let compilationTime: number;
      if (stats?.endTime && stats?.startTime) {
        compilationTime = stats.endTime - stats.startTime;
      } else {
        compilationTime = Date.now() - startTime;
      }

      const collectBaseTelemetryData = () => {
        const reactToolsCount =
          Array.from(toolPaths).filter(isReactFile).length;

        return {
          duration: compilationTime,
          toolsCount: toolPaths.size,
          reactToolsCount,
          promptsCount: promptPaths.size,
          resourcesCount: resourcePaths.size,
          transport: xmcpConfig.http ? TransportType.HTTP : TransportType.STDIO,
          adapter: xmcpConfig.experimental?.adapter
            ? (xmcpConfig.experimental.adapter as AdapterType)
            : AdapterType.NONE,
          nodeVersion: process.version,
          xmcpVersion: XMCP_VERSION,
        };
      };

      const getOutputSize = () => {
        let outputSize = 0;
        try {
          const distPath = path.join(process.cwd(), "dist");
          if (fs.existsSync(distPath)) {
            const files = fs.readdirSync(distPath);
            files.forEach((file) => {
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
        return outputSize;
      };

      // Handle errors
      if (err || stats?.hasErrors()) {
        if (err) {
          console.error(err);
        }
        if (stats?.hasErrors()) {
          const statsJson = stats.toJson({
            all: false,
            errors: true,
            warnings: false,
          });
          const hasOnlyStaleImportMapError =
            mode === "development" &&
            !!statsJson.errors?.length &&
            statsJson.errors.every((error) => {
              const message =
                typeof error.message === "string" ? error.message : "";
              const moduleName =
                typeof error.moduleName === "string" ? error.moduleName : "";
              return (
                (message.includes("Module not found") ||
                  message.includes("Can't resolve")) &&
                (message.includes(".xmcp/import-map.js") ||
                  moduleName.includes(".xmcp/import-map.js"))
              );
            });

          if (hasOnlyStaleImportMapError) {
            const staleErrors = statsJson.errors ?? [];
            const staleSignature = staleErrors
              .map((error) =>
                typeof error.message === "string" ? error.message : "unknown"
              )
              .sort()
              .join("|");
            const staleCount =
              (staleImportErrorSuppressions.get(staleSignature) ?? 0) + 1;
            staleImportErrorSuppressions.set(staleSignature, staleCount);

            if (staleCount === 1) {
              return;
            }
          }

          console.error(
            stats.toString({
              colors: true,
              chunks: false,
            })
          );
        }

        // Track failed build (only in production)
        if (mode === "production") {
          const statsJson = stats?.toJson({
            all: false,
            errors: true,
            warnings: false,
          });
          const statsError = statsJson?.errors?.[0];
          const errorType =
            (err && err.constructor ? err.constructor.name : undefined) ||
            (statsError?.name as string | undefined) ||
            (typeof statsError?.moduleName === "string"
              ? statsError.moduleName
              : undefined) ||
            (statsError?.message as string | undefined) ||
            "WebpackError";

          logBuildFailure({
            ...collectBaseTelemetryData(),
            errorPhase: ErrorPhase.WEBPACK,
            errorType,
          });
        }

        return;
      }

      // Build succeeded
      staleImportErrorSuppressions.clear();
      if (firstBuild) {
        onFirstBuild(xmcpConfig);
      } else {
        // on dev mode, bundler will recompile the code, so we need to start the http server after the first one
        if (
          mode === "development" &&
          xmcpConfig["http"] &&
          !xmcpConfig.experimental?.adapter
        ) {
          const currentBuildHash =
            typeof stats?.hash === "string" ? stats.hash : null;
          const shouldRestart =
            currentBuildHash === null
              ? lastRestartedBuildHash === null
              : currentBuildHash !== lastRestartedBuildHash;

          if (shouldRestart) {
            lastRestartedBuildHash = currentBuildHash;
            await restartHttpServerSafely();
          }
        }
      }

      if (mode === "development" && platforms.cloudflare) {
        try {
          await buildCloudflareOutput({ log: firstBuild });
        } catch (error) {
          console.error(
            chalk.red("❌ Failed to sync Cloudflare Workers output:"),
            error
          );
        }
      }

      if (mode === "production") {
        logBuildSuccess({
          ...collectBaseTelemetryData(),
          outputSize: getOutputSize(),
        });
      }

      // user defined callback should fire after every successful build
      onBuild?.();

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

  const entries = new Map<string, string>();
  const clientBundles = new Map<string, string>();

  const outputDir = "dist/client";

  for (const reactToolPath of reactToolPaths) {
    const toolName = pathToToolName(reactToolPath);
    const bundlePath = `${outputDir}/${toolName}.bundle.js`;

    entries.set(toolName, reactToolPath);
    clientBundles.set(toolName, bundlePath);
  }

  await transpileClientComponent(entries, outputDir);

  return clientBundles;
}

/**
 * Generates all runtime code and builds client bundles if needed
 * This centralizes all code generation logic including client bundle building
 */
async function generateCode({
  rebuildClientBundles = true,
}: {
  rebuildClientBundles?: boolean;
} = {}) {
  const { clientBundles: currentClientBundles } = compilerContext.getContext();
  const clientBundles =
    rebuildClientBundles || currentClientBundles === undefined
      ? await buildClientBundles()
      : currentClientBundles;

  // Store in context for import map generation
  compilerContext.setContext({ clientBundles });

  // Generate import map code (includes client bundles)
  const fileContent = generateImportCode();
  writeFileIfChanged(path.join(runtimeFolderPath, "import-map.js"), fileContent);

  // Generate runtime exports for global access
  const runtimeExportsCode = generateEnvCode();
  const envFilePath = path.join(rootFolder, "xmcp-env.d.ts");
  writeFileIfChanged(envFilePath, runtimeExportsCode);

  // only generating tools files for nextjs adapter mode
  const { xmcpConfig } = compilerContext.getContext();
  if (xmcpConfig?.experimental?.adapter === "nextjs") {
    const toolsCode = generateToolsExportCode();
    writeFileIfChanged(path.join(runtimeFolderPath, "tools.js"), toolsCode);
    const typesCode = generateToolsTypesCode();
    writeFileIfChanged(path.join(runtimeFolderPath, "tools.d.ts"), typesCode);
  }
}

function writeFileIfChanged(filePath: string, content: string) {
  if (fs.existsSync(filePath)) {
    const currentContent = fs.readFileSync(filePath, "utf8");
    if (currentContent === content) {
      return;
    }
  }
  fs.writeFileSync(filePath, content);
}
