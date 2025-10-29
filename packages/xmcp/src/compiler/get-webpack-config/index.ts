import {
  Configuration,
  DefinePlugin,
  ProvidePlugin,
  BannerPlugin,
  IgnorePlugin,
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
      // Ignore @swc/core native bindings and wasm fallbacks during build
      // These are externalized and loaded at runtime when SSR is enabled
      new IgnorePlugin({
        resourceRegExp: /^@swc\/core/,
        contextRegExp: /ssr/,
      }),
      new IgnorePlugin({
        resourceRegExp: /@swc\/core-(darwin|linux|win32|freebsd|android)/,
      }),
      new IgnorePlugin({
        resourceRegExp: /swc\.(darwin|linux|win32|freebsd|android).*\.node$/,
      }),
      new IgnorePlugin({
        resourceRegExp: /@swc\/wasm/,
      }),
    ],
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          use: {
            loader: "swc-loader",
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
          test: /\.node$/,
          loader: "node-loader",
        },
      ],
    },
    ignoreWarnings: [
      // Ignore warnings from @swc/core's optional native bindings
      /Can't resolve '\.\/swc\./,
      /Can't resolve '@swc\/core-/,
      /Can't resolve '@swc\/wasm'/,
      /Critical dependency: the request of a dependency is an expression/,
    ],
    optimization: {
      minimize: mode === "production",
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

  if (xmcpConfig.experimental?.ssr) {
    const fs = require("fs");
    const clientBundlesPath = path.join(processFolder, "dist/client");

    config.plugins!.push(
      new DefinePlugin({
        INJECTED_CLIENT_BUNDLES: DefinePlugin.runtimeValue(() => {
          if (!fs.existsSync(clientBundlesPath)) {
            console.warn(
              `⚠️  Client bundles directory not found at: ${clientBundlesPath}`
            );
            return JSON.stringify({});
          }

          const bundles: Record<string, string> = {};
          const files = fs.readdirSync(clientBundlesPath);

          for (const file of files) {
            if (file.endsWith(".bundle.js")) {
              const toolName = file.replace(".bundle.js", "");
              const bundleContent = fs.readFileSync(
                path.join(clientBundlesPath, file),
                "utf-8"
              );
              bundles[toolName] = bundleContent;
            }
          }

          const bundleCount = Object.keys(bundles).length;
          if (bundleCount > 0) {
            console.log(
              `✓ Injected ${bundleCount} SSR client bundle(s): ${Object.keys(bundles).join(", ")}`
            );
          }

          return JSON.stringify(bundles);
        }),
      })
    );
  }

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
