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
import {
  CreateTypeDefinitionPlugin,
  InjectRuntimePlugin,
  readClientBundlesFromDisk,
} from "./plugins";
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

  const isCloudflare = xmcpConfig.experimental?.adapter === "cloudflare";

  // For Cloudflare, we need to resolve the xmcp source path for the @ alias
  // since the cloudflare adapter is built from TypeScript source
  // The path is injected at build time via DefinePlugin
  // @ts-expect-error: injected by compiler
  const xmcpSrcPath = isCloudflare ? (typeof XMCP_SRC_PATH === "string" ? XMCP_SRC_PATH : path.resolve(__dirname, "..", "..")) : undefined;

  const config: RspackOptions = {
    mode,
    watch: mode === "development",
    devtool: mode === "development" ? "eval-cheap-module-source-map" : false,
    output: {
      filename: outputFilename,
      path: outputPath,
      // Use ESM output for Cloudflare, CommonJS for Node.js
      ...(isCloudflare
        ? {
            library: { type: "module" },
            chunkFormat: "module",
            module: true,
          }
        : {
            libraryTarget: "commonjs2",
          }),
      clean: {
        keep: xmcpConfig.experimental?.adapter
          ? undefined
          : path.join(outputPath, "client"),
      },
    },
    // Use webworker target for Cloudflare, node for everything else
    target: isCloudflare ? "webworker" : "node",
    // For Cloudflare, async_hooks is external (provided by nodejs_compat)
    // For Node.js, use getExternals() to externalize Node.js modules
    externals: isCloudflare
      ? { async_hooks: "async_hooks" }
      : getExternals(),
    // Enable ESM experiments for Cloudflare
    experiments: isCloudflare ? { outputModule: true } : undefined,
    resolve: {
      fallback: {
        process: false,
        // For Cloudflare Workers, we need to handle Node.js built-ins
        ...(isCloudflare
          ? {
              fs: false,
              path: false,
              stream: false,
              http: false,
              https: false,
              net: false,
              tls: false,
              zlib: false,
              os: false,
              url: false,
              util: false,
              events: false,
              buffer: false,
              querystring: false,
              string_decoder: false,
              crypto: false,
            }
          : {}),
      },
      alias: {
        "node:process": "process",
        "xmcp/headers": path.resolve(processFolder, ".xmcp/headers.js"),
        "xmcp/utils": path.resolve(processFolder, ".xmcp/utils.js"),
        // For Cloudflare, point to source; for Node.js, point to pre-built
        "xmcp/plugins/x402": isCloudflare && xmcpSrcPath
          ? path.join(xmcpSrcPath, "plugins/x402/index.ts")
          : path.resolve(processFolder, ".xmcp/x402.js"),
        // For Cloudflare, add @ alias to resolve xmcp source paths
        ...(isCloudflare && xmcpSrcPath
          ? {
              "@": xmcpSrcPath,
              "xmcp/cloudflare": path.join(xmcpSrcPath, "runtime/adapters/cloudflare/index.ts"),
            }
          : {}),
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
      // For Cloudflare, we need to ensure everything is in a single bundle
      // Disable runtime chunk to prevent dynamic imports
      ...(isCloudflare ? { runtimeChunk: false } : {}),
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
  const definedVariables: Record<string, string | undefined> =
    getInjectedVariables(xmcpConfig);

  // For Cloudflare, inject client bundles at compile time
  if (isCloudflare) {
    const clientBundles = readClientBundlesFromDisk();
    definedVariables["INJECTED_CLIENT_BUNDLES"] = JSON.stringify(clientBundles);
  } else {
    // For Node.js, set to undefined so the runtime uses fs
    definedVariables["INJECTED_CLIENT_BUNDLES"] = "undefined";
  }

  // Filter out undefined values for DefinePlugin (requires Record<string, string>)
  const filteredVariables: Record<string, string> = {};
  for (const [key, value] of Object.entries(definedVariables)) {
    if (value !== undefined) {
      filteredVariables[key] = value;
    }
  }

  config.plugins!.push(new DefinePlugin(filteredVariables));

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
