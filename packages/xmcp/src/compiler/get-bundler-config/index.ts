import {
  RspackOptions,
  ProvidePlugin,
  DefinePlugin,
  BannerPlugin,
} from "@rspack/core";
import path from "path";
import { distOutputPath, adapterOutputPath } from "@/utils/constants";
import { compilerContext } from "@/compiler/compiler-context";
import { XmcpConfigOutputSchema } from "@/compiler/config";
import { getEntries } from "./get-entries";
import { getInjectedVariables } from "./get-injected-variables";
import { resolveTsconfigPathsToAlias } from "./resolve-tsconfig-paths";
import { CreateTypeDefinitionPlugin, InjectRuntimePlugin } from "./plugins";
import { getExternals } from "./get-externals";
import { TsCheckerRspackPlugin } from "ts-checker-rspack-plugin";

/** Creates the bundler configuration that xmcp will use to bundle the user's code */
export function getRspackConfig(
  xmcpConfig: XmcpConfigOutputSchema
): RspackOptions {
  const processFolder = process.cwd();
  const { mode } = compilerContext.getContext();

  const outputPath = xmcpConfig.experimental?.adapter
    ? adapterOutputPath
    : distOutputPath;

  const outputFilename = xmcpConfig.experimental?.adapter
    ? "index.js"
    : "[name].js";

  const config: RspackOptions = {
    mode,
    watch: mode === "development",
    devtool: mode === "development" ? "eval-cheap-module-source-map" : false,
    output: {
      filename: outputFilename,
      path: outputPath,
      libraryTarget: "commonjs2",
      clean: {
        keep: xmcpConfig.experimental?.adapter
          ? undefined
          : path.join(outputPath, "client"),
      },
    },
    target: "node",
    externals: getExternals(),
    resolve: {
      fallback: {
        process: false,
      },
      alias: {
        "node:process": "process",
        "xmcp/headers": path.resolve(processFolder, ".xmcp/headers.js"),
        "xmcp/utils": path.resolve(processFolder, ".xmcp/utils.js"),
        "xmcp/plugins/x402": path.resolve(processFolder, ".xmcp/x402.js"),
        ...resolveTsconfigPathsToAlias(),
      },
      extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
    },
    resolveLoader: {
      modules: [
        "node_modules",
        path.resolve(__dirname, "../node_modules"), // for monorepo/npm
        path.resolve(__dirname, "../.."), // for pnpm
      ],
    },
    plugins: [
      new InjectRuntimePlugin(),
      new CreateTypeDefinitionPlugin(),
      xmcpConfig.typescript?.skipTypeCheck ? null : new TsCheckerRspackPlugin(),
    ],
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          use: {
            loader: "builtin:swc-loader",
            options: {
              jsc: {
                parser: {
                  syntax: "typescript",
                  tsx: true,
                },
                transform: {
                  react: {
                    runtime: "automatic",
                  },
                },
                target: "es2020",
              },
            },
          },
        },
        {
          test: /\.css$/,
          type: "asset/source",
        },
      ],
    },
    optimization: {
      minimize: mode === "production",
      mergeDuplicateChunks: true,
      splitChunks: false,
    },
  };

  // Do not watch the adapter output folder and dist/client, avoid infinite loop
  if (mode === "development" && !xmcpConfig.experimental?.adapter) {
    config.watchOptions = {
      ignored: [adapterOutputPath, path.join(processFolder, "dist/client")],
    };
  }

  const providedPackages = {
    // connects the user exports with our runtime
    INJECTED_TOOLS: [
      path.resolve(processFolder, ".xmcp/import-map.js"),
      "tools",
    ],
    INJECTED_PROMPTS: [
      path.resolve(processFolder, ".xmcp/import-map.js"),
      "prompts",
    ],
    INJECTED_RESOURCES: [
      path.resolve(processFolder, ".xmcp/import-map.js"),
      "resources",
    ],
    INJECTED_MIDDLEWARE: [
      path.resolve(processFolder, ".xmcp/import-map.js"),
      "middleware",
    ],
  };

  // add entry points based on config
  config.entry = getEntries(xmcpConfig);

  // add injected variables to config
  config.plugins!.push(new ProvidePlugin(providedPackages));

  // add defined variables to config
  const definedVariables = getInjectedVariables(xmcpConfig);
  config.plugins!.push(new DefinePlugin(definedVariables));

  // add shebang to CLI output on stdio mode
  if (xmcpConfig.stdio) {
    config.plugins!.push(
      new BannerPlugin({
        banner: "#!/usr/bin/env node",
        raw: true,
        include: /^stdio\.js$/,
      })
    );
  }

  return config;
}
