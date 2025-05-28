import { Compiler, Configuration, DefinePlugin, ProvidePlugin } from "webpack";
import path from "path";
import { outputPath, runtimeFolderPath } from "./constants";
import fs from "fs-extra";
import nodeExternals from "webpack-node-externals";
import { CompilerMode } from "..";
import {
  DEFAULT_SSE_BODY_SIZE_LIMIT,
  DEFAULT_SSE_PORT,
  XmcpConfig,
} from "./parse-config";

export function getWebpackConfig(
  mode: CompilerMode,
  xmcpConfig: XmcpConfig
): Configuration {
  const processFolder = process.cwd();
  const config: Configuration = {
    mode,
    watch: mode === "development",
    output: {
      filename: "[name].js",
      path: outputPath,
      libraryTarget: "commonjs2",
    },
    target: "node",
    externals: [nodeExternals()],
    resolve: {
      fallback: {
        process: false,
      },
      alias: {
        "node:process": "process",
      },
      extensions: [".ts", ".js"],
    },
    plugins: [new InjectRuntimePlugin()],
    module: {
      rules: [
        {
          test: /\.(ts|js)$/,
          use: "swc-loader",
        },
      ],
    },
  };

  const providedPackages = {
    // connects the user exports with our runtime
    INJECTED_TOOLS: [
      path.resolve(processFolder, ".xmcp/import-map.js"),
      "default",
    ],
  };

  // thsi will inject definitions for the following variables when bundling the code
  const definedVariables: Record<string, string | number | boolean> = {};

  // add entry points based on config
  const entry: Configuration["entry"] = {};
  if (xmcpConfig.stdio) {
    // setup entry point
    entry.stdio = path.join(runtimeFolderPath, "stdio.js");
  }
  if (xmcpConfig.sse) {
    // setup entry point
    entry.sse = path.join(runtimeFolderPath, "sse.js");
    // define variables
    definedVariables.SSE_DEBUG = mode === "development";
    if (typeof xmcpConfig.sse === "object") {
      definedVariables.SSE_PORT = xmcpConfig.sse.port;
      definedVariables.SSE_BODY_SIZE_LIMIT = xmcpConfig.sse.bodySizeLimit;
    } else {
      // sse config is boolean
      definedVariables.SSE_PORT = DEFAULT_SSE_PORT;
      definedVariables.SSE_BODY_SIZE_LIMIT = DEFAULT_SSE_BODY_SIZE_LIMIT;
    }
  }
  config.entry = entry;

  // add injected variables to config
  config.plugins!.push(new ProvidePlugin(providedPackages));

  // add defined variables to config
  config.plugins!.push(new DefinePlugin(definedVariables));

  return config;
}

class InjectRuntimePlugin {
  apply(compiler: Compiler) {
    let hasRun = false;
    compiler.hooks.beforeCompile.tap(
      "InjectRuntimePlugin",
      (_compilationParams) => {
        if (hasRun) return;
        hasRun = true;
        fs.writeFileSync(
          path.join(runtimeFolderPath, "stdio.js"),
          // @ts-expect-error: injected by compiler
          RUNTIME_STDIO
        );
        // @ts-expect-error: injected by compiler
        fs.writeFileSync(path.join(runtimeFolderPath, "sse.js"), RUNTIME_SSE);
      }
    );
  }
}
