/**
 * This script builds the compiler. It's not the compiler itself
 * */

import path from "path";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import nodeExternals from "webpack-node-externals";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import { rspack, RspackOptions, EntryObject } from "@rspack/core";
import { outputPath, runtimeOutputPath } from "./constants";
import { srcPath } from "./constants";
import chalk from "chalk";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";

const mode =
  process.env.NODE_ENV === "production" ? "production" : "development";

/** Since we are using webpack to build webpack, we need to exclude some modules */
const libsToExcludeFromCompilation = [
  "webpack",
  "webpack-virtual-modules",
  "webpack-node-externals",
  "ts-loader",
  "fork-ts-checker-webpack-plugin",
  "xmcp/headers",
  "@swc/core", // Native binary module
  "@swc/wasm", // WASM module
  "esbuild", // Native binary module
];

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
  entry,
  mode: "production",
  devtool: false,
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
    path: runtimeOutputPath,
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
    minimize: true,
    splitChunks: false,
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        configFile: path.join(srcPath, "..", "tsconfig.json"),
      },
    }),
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: false,
      cleanOnceBeforeBuildPatterns: [outputPath],
    }),
  ],
  watch: mode === "development",
};

// Only generate bundle stats when explicitly requested (for analysis)
if (process.env.GENERATE_STATS === "true") {
  config.plugins?.push(
    new BundleAnalyzerPlugin({
      analyzerMode: "disabled",
      generateStatsFile: true,
      statsFilename: path.join(srcPath, "..", "stats-runtime.json"),
      statsOptions: {
        source: false,
        reasons: true,
        chunks: true,
        modules: true,
        assets: true,
      },
    })
  );
}

// Fix issues with importing unsupported modules
// Ignore platform-specific and native binary modules
if (process.platform !== "darwin") {
  config.plugins?.push(
    new rspack.IgnorePlugin({
      resourceRegExp: /^fsevents$/,
    })
  );
}

// Always ignore these problematic modules
config.plugins?.push(
  // Ignore @swc/wasm - we use the native binary instead
  new webpack.IgnorePlugin({
    resourceRegExp: /^@swc\/wasm$/,
  }),
  // Ignore native binaries from @swc/core
  new webpack.IgnorePlugin({
    resourceRegExp: /\.node$/,
    contextRegExp: /@swc/,
  })
);

let compileStarted = false;

// ✨
export function buildRuntime(onCompiled: (stats: any) => void) {
  console.log(chalk.bgGreen.bold("Starting runtime compilation"));
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

    console.log(chalk.bgGreen.bold("xmcp runtime compiled"));

    if (compileStarted) {
      return;
    } else {
      compileStarted = true;
      onCompiled(stats);
    }
  });
}
