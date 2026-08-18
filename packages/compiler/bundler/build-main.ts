import path from "path";
import { fileURLToPath } from "url";
import { rspack, type RspackOptions } from "@rspack/core";
import chalk from "chalk";
import { runCompiler } from "./compiler-manager";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getConfig(): RspackOptions {
  const mode =
    process.env.NODE_ENV === "production" ? "production" : "development";
  const srcPath = path.join(__dirname, "..", "src");

  return {
    name: "compiler",
    entry: {
      cli: path.join(srcPath, "cli.ts"),
      "detached-flush": path.join(
        srcPath,
        "telemetry/events/detached-flush.ts"
      ),
    },
    mode,
    devtool: mode === "production" ? false : "source-map",
    target: "node",
    externalsPresets: { node: true },
    externals: {
      "@rspack/core": "@rspack/core",
      "ts-checker-rspack-plugin": "ts-checker-rspack-plugin",
      typescript: "typescript",
      "xmcp/config": "xmcp/config",
      zod: "zod",
      "zod/v3": "zod/v3",
    },
    output: {
      filename: "[name].js",
      path: path.join(__dirname, "..", "dist"),
      globalObject: "this",
      library: { type: "umd" },
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
                  decorators: true,
                },
                target: "es2020",
              },
              module: { type: "es6" },
            },
          },
        },
        {
          test: /\.(d\.ts|node)$/,
          type: "asset/resource",
          generator: { emit: false },
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
      alias: { "@": srcPath },
    },
    watchOptions: {
      aggregateTimeout: 600,
      ignored: /node_modules/,
    },
    optimization: { minimize: mode === "production" },
    plugins: [
      new rspack.BannerPlugin({
        banner: "#!/usr/bin/env node",
        raw: true,
        include: /^cli\.js$/,
      }),
      new rspack.IgnorePlugin({ resourceRegExp: /^fsevents$/ }),
    ],
    watch: mode === "development",
  };
}

export function buildCompiler(): void {
  console.log(chalk.bgGreen.bold("Starting @xmcp-dev/compiler compilation"));

  runCompiler(getConfig(), (err, stats) => {
    if (err) {
      console.error(err);
      return;
    }

    if (stats?.hasErrors()) {
      console.error(stats.toString({ colors: true, chunks: false }));
      return;
    }

    console.log(stats?.toString({ colors: true, chunks: false }));
    console.log(chalk.bgGreen.bold("@xmcp-dev/compiler compiled"));
  });
}
