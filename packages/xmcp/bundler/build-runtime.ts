/**
 * This script builds the compiler. It's not the compiler itself
 * */

import path from "path";
import { fileURLToPath } from "url";
import { TsCheckerRspackPlugin } from "ts-checker-rspack-plugin";
import { rspack, RspackOptions, EntryObject } from "@rspack/core";
import { runtimeOutputPath, srcPath, iconsPath } from "./constants";
import chalk from "chalk";
import { runCompiler } from "./compiler-manager";
import fs from "fs-extra";

const mode =
  process.env.NODE_ENV === "production" ? "production" : "development";

interface RuntimeRoot {
  name: string;
  path: string;
}

const runtimeRoots: RuntimeRoot[] = [
  { name: "headers", path: "headers" },
  { name: "stdio", path: "transports/stdio" },
  { name: "http", path: "transports/http" },
  { name: "adapter-express", path: "adapters/express" },
  { name: "adapter-nextjs", path: "adapters/nextjs" },
];
const entry: EntryObject = {};

// add dynamic entries
for (const root of runtimeRoots) {
  entry[root.name] = path.join(srcPath, "runtime", root.path);
}

const config: RspackOptions = {
  name: "runtime",
  entry,
  mode: "production",
  devtool: false,
  target: "node",
  externalsPresets: { node: true },
  externals: {
    "@rspack/core": "@rspack/core",
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
      "@xmcp/icons": iconsPath,
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

    console.log(
      stats?.toString({
        colors: true,
        chunks: false,
      })
    );

    console.log(chalk.bgGreen.bold("xmcp runtime compiled"));

    if (process.env.GENERATE_STATS === "true" && stats) {
      const statsJson = stats.toJson({
        all: false,
        assets: true,
        chunks: true,
        modules: true,
        reasons: true,
        timings: true,
      });
      const statsPath = path.join(__dirname, "..", "stats-runtime.json");
      fs.writeFileSync(statsPath, JSON.stringify(statsJson, null, 2));
      console.log(chalk.green(`Saved runtime stats to ${statsPath}`));
    }

    // Only call onCompiled once for the initial build
    if (!compileStarted) {
      compileStarted = true;
      onCompiled(stats);
    }
  };

  runCompiler(config, handleStats);
}
