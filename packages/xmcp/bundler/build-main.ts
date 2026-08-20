/**
 * This script builds the compiler. It's not the compiler itself
 * */

import path from "path";
import { rspack, RspackOptions } from "@rspack/core";
import { TsCheckerRspackPlugin } from "ts-checker-rspack-plugin";
import { fileURLToPath } from "url";
import fs from "fs-extra";
import { execSync } from "child_process";
import chalk from "chalk";
import { runCompiler } from "./compiler-manager";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compilePackageTypes = () => {
  // bundle xmcp with its own package tsconfig
  execSync("tsc --emitDeclarationOnly --project xmcp.tsconfig.json", {
    stdio: "inherit",
  });
};

function getConfig() {
  const mode =
    process.env.NODE_ENV === "production" ? "production" : "development";

  const srcPath = path.join(__dirname, "..", "src");
  const outputPath = path.join(__dirname, "..", "dist");

  const config: RspackOptions = {
    name: "main",
    entry: {
      index: path.join(srcPath, "index.ts"),
      "host-bridge": path.join(srcPath, "host-bridge.ts"),
      cloudflare: path.join(srcPath, "cloudflare.ts"),
      config: path.join(srcPath, "config", "index.ts"),
      cli: path.join(srcPath, "cli.ts"),
    },
    mode,
    devtool: mode === "production" ? false : "source-map",
    target: "node",
    externalsPresets: { node: true },
    externals: {
      zod: "zod",
      "zod/v3": "zod/v3",
      "@rspack/core": "@rspack/core",
    },
    output: {
      filename: "[name].js",
      path: outputPath,
      globalObject: "this",
      library: {
        type: "umd",
      },
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
        // Ignore .d.ts and .node files that webpack tries to parse
        {
          test: /\.(d\.ts|node)$/,
          type: "asset/resource",
          generator: {
            emit: false,
          },
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
      alias: {
        "@": srcPath,
      },
    },
    watchOptions: {
      aggregateTimeout: 600,
      ignored: /node_modules/,
    },
    optimization: {
      minimize: mode === "production",
    },
    plugins: [
      new TsCheckerRspackPlugin(),
      // add shebang to CLI output
      new rspack.BannerPlugin({
        banner: "#!/usr/bin/env node",
        raw: true,
        include: /^cli\.js$/,
      }),
    ],
    watch: mode === "development",
  };

  // Fix issues with importing unsupported modules
  config.plugins?.push(
    new rspack.IgnorePlugin({
      resourceRegExp: /^fsevents$/,
    })
  );

  return config;
}

// ✨
export function buildMain() {
  console.log(chalk.bgGreen.bold("Starting xmcp compilation"));

  const config = getConfig();

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

    if (process.env.GENERATE_STATS === "true" && stats) {
      const statsJson = stats.toJson({
        all: false,
        assets: true,
        chunks: true,
        modules: true,
        reasons: true,
        timings: true,
      });
      const statsPath = path.join(__dirname, "..", "stats-main.json");
      fs.writeFileSync(statsPath, JSON.stringify(statsJson, null, 2));
      console.log(chalk.green(`Saved main stats to ${statsPath}`));
    }

    compilePackageTypes();

    console.log(chalk.bgGreen.bold("xmcp compiled"));
  };

  runCompiler(config, handleStats);
}
