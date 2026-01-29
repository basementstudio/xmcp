/**
 * This script builds the runtime files. It's not the compiler itself.
 */

import path from "path";
import { fileURLToPath } from "url";
import { TsCheckerRspackPlugin } from "ts-checker-rspack-plugin";
import { rspack, RspackOptions, EntryObject } from "@rspack/core";
import { runtimeOutputPath, srcPath } from "./constants";
import chalk from "chalk";
import { runCompiler } from "./compiler-manager";
import fs from "fs-extra";

const mode =
  process.env.NODE_ENV === "production" ? "production" : "development";

interface RuntimeRoot {
  name: string;
  path: string;
}

// Node.js runtime roots (express, nextjs adapters + transports)
const runtimeRoots: RuntimeRoot[] = [
  { name: "headers", path: "headers" },
  { name: "stdio", path: "transports/stdio" },
  { name: "http", path: "transports/http" },
  { name: "adapter-express", path: "adapters/express" },
  { name: "adapter-nextjs", path: "adapters/nextjs" },
  { name: "adapter-nestjs", path: "adapters/nestjs" },
];

const entry: EntryObject = {};
for (const root of runtimeRoots) {
  entry[root.name] = path.join(srcPath, "runtime", root.path);
}

// Node.js config (express, nextjs, http, stdio)
const config: RspackOptions = {
  name: "runtime-node",
  entry,
  mode: "production",
  devtool: false,
  target: "node",
  externalsPresets: { node: true },
  externals: {
    "@rspack/core": "@rspack/core",
    "@nestjs/common": "@nestjs/common",
  },
  output: {
    filename: "[name].js",
    path: runtimeOutputPath,
    globalObject: "this",
    library: {
      type: "umd",
    },
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: "builtin:swc-loader",
          options: {
            jsc: {
              parser: {
                syntax: "typescript",
                tsx: false,
                decorators: true,
              },
              transform: {
                legacyDecorator: true,
                decoratorMetadata: true,
              },
              target: "es2020",
            },
            module: {
              type: "es6",
            },
          },
        },
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
    alias: {
      "@": srcPath,
      "xmcp/plugins/x402": path.join(srcPath, "plugins/x402"),
    },
  },
  watchOptions: {
    aggregateTimeout: 600,
    ignored: /node_modules/,
  },
  optimization: {
    minimize: true,
    splitChunks: false,
  },
  plugins: [new TsCheckerRspackPlugin()],
  watch: mode === "development",
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fix issues with importing unsupported modules
// Ignore platform-specific and native binary modules
if (process.platform !== "darwin") {
  config.plugins?.push(
    new rspack.IgnorePlugin({
      resourceRegExp: /^fsevents$/,
    })
  );
}

let compileStarted = false;

// ✨
export function buildRuntime(onCompiled: (stats: any) => void) {
  console.log(chalk.bgGreen.bold("Starting runtime compilation"));

  const handleStats = (err: Error | null, stats: any) => {
    if (err) {
      console.error("Runtime build error:", err);
      return;
    }

    if (stats?.hasErrors()) {
      console.error(
        "Runtime build errors:",
        stats.toString({
          colors: true,
          chunks: false,
        })
      );
      return;
    }

    console.log(
      stats?.toString({
        colors: true,
        chunks: false,
      })
    );

    if (!compileStarted) {
      compileStarted = true;
      console.log(chalk.bgGreen.bold("xmcp runtime compiled"));

      onCompiled(stats);
    }
  };

  runCompiler(config, handleStats);
}
