import {
  Configuration,
  DefinePlugin,
  ProvidePlugin,
  BannerPlugin,
} from "webpack";
import path from "path";
import { distOutputPath, adapterOutputPath } from "@/utils/constants";
import { compilerContext } from "@/compiler/compiler-context";
import { XmcpConfigOuputSchema } from "@/compiler/config";
import { getEntries } from "./get-entries";
import { getInjectedVariables } from "./get-injected-variables";
import { resolveTsconfigPathsToAlias } from "./resolve-tsconfig-paths";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import { CreateTypeDefinitionPlugin, InjectRuntimePlugin } from "./plugins";
import { getExternals } from "./get-externals";

/** Creates the webpack configuration that xmcp will use to bundle the user's code */
export function getWebpackConfig(
  xmcpConfig: XmcpConfigOuputSchema
): Configuration {
  const processFolder = process.cwd();
  const { mode } = compilerContext.getContext();

  const outputPath = xmcpConfig.experimental?.adapter
    ? adapterOutputPath
    : distOutputPath;

  const outputFilename = xmcpConfig.experimental?.adapter
    ? "index.js"
    : "[name].js";

  const config: Configuration = {
    mode,
    watch: mode === "development",
    devtool: mode === "development" ? "eval-cheap-module-source-map" : false,
    output: {
      filename: outputFilename,
      path: outputPath,
      libraryTarget: "commonjs2",
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
        ...resolveTsconfigPathsToAlias(),
      },
      extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
    },
    plugins: [new InjectRuntimePlugin(), new CreateTypeDefinitionPlugin()],
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: "swc-loader",
        },
      ],
    },
    optimization: {
      minimize: mode === "production",
      splitChunks: false,
    },
  };

  // Do not watch the adapter output folder, avoid infinite loop
  if (mode === "development" && !xmcpConfig.experimental?.adapter) {
    config.watchOptions = {
      ignored: [adapterOutputPath],
    };
  }

  const providedPackages = {
    // connects the user exports with our runtime
    INJECTED_TOOLS: [
      path.resolve(processFolder, ".xmcp/import-map.js"),
      "tools",
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

  // add clean plugin
  if (!xmcpConfig.experimental?.adapter) {
    // not needed in adapter mode since it only outputs one file
    config.plugins!.push(new CleanWebpackPlugin());
  }

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
