/**
 * This script builds the compiler. It's not the compiler itself
 * */

import path from "path";
import { rspack, RspackOptions } from "@rspack/core";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import { fileURLToPath } from "url";
import { runtimeOutputPath } from "./constants";
import fs from "fs-extra";
import { execSync } from "child_process";
import chalk from "chalk";

const compilePackageTypes = () => {
  // bundle xmcp with its own package tsconfig
  execSync("tsc --emitDeclarationOnly --project xmcp.tsconfig.json", {
    stdio: "inherit",
  });
};

function getConfig() {
  const mode =
    process.env.NODE_ENV === "production" ? "production" : "development";

  /** Since we are using webpack to build webpack, we need to exclude some modules */
  const libsToExcludeFromCompilation = [
    "webpack",
    "webpack-virtual-modules",
    "webpack-node-externals",
    "ts-loader",
    "fork-ts-checker-webpack-plugin",
    "zod",
  ];

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const srcPath = path.join(__dirname, "..", "src");
  const outputPath = path.join(__dirname, "..", "dist");

  // Read all files from runtime output path
  const runtimeFileNames = fs.readdirSync(runtimeOutputPath);

  interface FileDependency {
    name: string;
    path: string;
  }

  const fileDependencies: FileDependency[] = [];

  for (const fileName of runtimeFileNames) {
    const filePath = path.join(runtimeOutputPath, fileName);
    const stat = fs.statSync(filePath);

    // Only read files, not directories
    if (stat.isFile()) {
      fileDependencies.push({
        name: fileName,
        path: filePath,
      });
    }
  }

  const config: RspackOptions = {
    entry: {
      index: path.join(srcPath, "index.ts"),
      cli: path.join(srcPath, "cli.ts"),
    },
    mode,
    devtool: mode === "production" ? false : "source-map",
    target: "node",
    externalsPresets: { node: true },
    externals: {
      webpack: "webpack",
      "webpack-virtual-modules": "webpack-virtual-modules",
      "webpack-node-externals": "webpack-node-externals",
      "fork-ts-checker-webpack-plugin": "fork-ts-checker-webpack-plugin",
      zod: "zod",
      "@rspack/core": "@rspack/core",
      "@rspack/cli": "@rspack/cli",
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
            loader: "swc-loader",
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
      new ForkTsCheckerWebpackPlugin(),
      new rspack.DefinePlugin({
        RUNTIME_FILES: JSON.stringify(
          (() => {
            const runtimeFiles: Record<string, string> = {};
            for (const file of fileDependencies) {
              runtimeFiles[file.name] = fs.readFileSync(file.path, "utf-8");
            }
            return runtimeFiles;
          })()
        ),
      }),
      // add shebang to CLI output
      new rspack.BannerPlugin({
        banner: "#!/usr/bin/env node",
        raw: true,
        include: /^cli\.js$/,
      }),
    ],
    watch: mode === "development",
  };

  // Fix issues with importing unsupported fsevents module
  // For more info, see: https://github.com/vinceau/project-clippi/issues/48
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
  rspack(config, (err, stats) => {
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

    console.log(
      stats?.toString({
        colors: true,
        chunks: false,
      })
    );

    compilePackageTypes();

    console.log(chalk.bgGreen.bold("xmcp compiled"));
  });
}
