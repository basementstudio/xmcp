/**
 * This script builds the compiler. It's not the compiler itself
 * */

import path from "path";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import nodeExternals from "webpack-node-externals";
import webpack from "webpack";
import type { Configuration } from "webpack";
import { fileURLToPath } from "url";
import { runtimeOutputPath } from "./constants";
import fs from "fs-extra";
import { execSync } from "child_process";

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
  ];

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const srcPath = path.join(__dirname, "..", "src");
  const outputPath = path.join(__dirname, "..", "dist");

  const stdioPath = path.join(runtimeOutputPath, "stdio.js");
  const ssePath = path.join(runtimeOutputPath, "sse.js");

  const stdioContent = fs.readFileSync(stdioPath, "utf-8");
  const sseContent = fs.readFileSync(ssePath, "utf-8");

  const config: Configuration = {
    entry: {
      index: path.join(srcPath, "index.ts"),
      cli: path.join(srcPath, "cli.ts"),
    },
    mode,
    devtool: mode === "production" ? false : "source-map",
    target: "node",
    externalsPresets: { node: true },
    externals: [
      nodeExternals({
        allowlist: (modulePath) => {
          return !libsToExcludeFromCompilation.includes(modulePath);
        },
      }),
    ],
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
      new webpack.DefinePlugin({
        RUNTIME_STDIO: JSON.stringify(stdioContent),
        RUNTIME_SSE: JSON.stringify(sseContent),
      }),
      // add shebang to CLI output
      new webpack.BannerPlugin({
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
    new webpack.IgnorePlugin({
      resourceRegExp: /^fsevents$/,
    })
  );

  return config;
}

// ✨
export function buildMain() {
  const config = getConfig();
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

    execSync("tsc --emitDeclarationOnly", { stdio: "inherit" });

    console.log(
      stats?.toString({
        colors: true,
        chunks: false,
      })
    );
  });
}
