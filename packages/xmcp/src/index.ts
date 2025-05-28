import { webpack } from "webpack";
import { getWebpackConfig } from "./utils/get-webpack-config";
import chalk from "chalk";
import { getConfig, XmcpConfig } from "./utils/parse-config";
import chokidar from "chokidar";
import { generateImportCode } from "./utils/generate-import-code";
import fs from "fs";
import { runtimeFolderPath } from "./utils/constants";
import { createFolder } from "./utils/fs-utils";
import path from "path";
import { deleteSync } from "del";
import { type z } from "zod";
import { spawn } from "child_process";
import nodemon from "nodemon";

export type CompilerMode = "development" | "production";

export interface CompileOptions {
  mode: CompilerMode;
  configFilePath?: string;
}

export async function compile({
  mode,
  configFilePath = "xmcp.config.json",
}: CompileOptions) {
  const startTime = Date.now();
  let compilerStarted = false;

  const xmcpConfig = getConfig(configFilePath);
  let config = getWebpackConfig(mode, xmcpConfig);

  if (xmcpConfig.webpack) {
    config = xmcpConfig.webpack(config);
  }

  let pathList: string[] = [];
  const watcher = chokidar.watch("./src/tools/**/*.ts", {
    ignored: /(^|[\/\\])\../,
    persistent: mode === "development",
  });

  watcher
    .on("add", (path) => {
      pathList.push(path);
      if (compilerStarted) {
        generateCode(pathList);
      }
    })
    .on("unlink", (path) => {
      pathList = pathList.filter((p) => p !== path);
      if (compilerStarted) {
        generateCode(pathList);
      }
    })
    .on("ready", () => {
      let firstBuild = true;
      compilerStarted = true;

      // delete existing runtime folder
      deleteSync(runtimeFolderPath);
      createFolder(runtimeFolderPath);

      if (mode === "production") {
        watcher.close();
      }

      generateCode(pathList);

      webpack(config, (err, stats) => {
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
          console.log(`Compiled in ${chalk.bold.green(`${duration}ms`)}`);
          onFirstBuild(mode, xmcpConfig);
        }
      });
    });
}

function startSseServer() {
  console.log(chalk.bold.green("Starting SSE server..."));

  nodemon({
    script: path.join(process.cwd(), "dist/sse.js"),
    watch: [path.join(process.cwd(), "dist")],
    ext: "js",
    delay: 1000, // Delay to avoid excessive restarts
  });

  // Log when nodemon starts/restarts the server
  nodemon
    .on("start", () => {
      console.log(chalk.green("SSE server started"));
    })
    .on("restart", (files) => {
      console.log(chalk.yellow("SSE server restarted"));
    })
    .on("crash", () => {
      console.error(chalk.red("SSE server crashed"));
      // Optional: restart the server after a delay
      setTimeout(() => {
        nodemon.emit("restart");
      }, 5000);
    })
    .on("quit", () => {
      console.log(chalk.yellow("SSE server terminated"));
      process.exit();
    });

  process.on("SIGINT", () => {
    nodemon.emit("quit");
  });

  process.on("SIGTERM", () => {
    nodemon.emit("quit");
  });

  process.on("SIGUSR2", () => {
    nodemon.emit("restart");
  });

  process.on("SIGUSR1", () => {
    nodemon.emit("restart");
  });

  process.on("exit", () => {
    nodemon.emit("quit");
  });

  process.on("uncaughtException", () => {
    nodemon.emit("quit");
  });
}

function generateCode(pathlist: string[]) {
  const fileContent = generateImportCode(pathlist);
  fs.writeFileSync(path.join(runtimeFolderPath, "import-map.js"), fileContent);
}

function onFirstBuild(mode: CompilerMode, xmcpConfig: XmcpConfig) {
  if (mode === "development") {
    if (xmcpConfig.sse) {
      startSseServer();
    }

    console.log(chalk.bold.green("Starting inspector..."));

    // start inspector
    const inspectorArgs = ["@modelcontextprotocol/inspector@latest"];

    if (xmcpConfig.stdio) {
      inspectorArgs.push("node", "dist/stdio.js");
    }

    const inspector = spawn("npx", inspectorArgs, {
      stdio: "inherit",
      shell: true,
    });

    inspector.on("error", (err: Error) => {
      console.error("Failed to start inspector:", err);
    });
  }

  const builtResults = [];

  if (xmcpConfig.sse) {
    builtResults.push("- SSE server");
  }
  if (xmcpConfig.stdio) {
    builtResults.push("- STDIO server");
  }

  console.log(chalk.bold.green("Built:"));
  builtResults.forEach((result) => {
    console.log(chalk.bold(result));
  });
}

export type InferSchema<T extends Record<string, z.ZodType>> = {
  [K in keyof T]: z.infer<T[K]>;
};
