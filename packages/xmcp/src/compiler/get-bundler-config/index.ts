import {
  RspackOptions,
  ProvidePlugin,
  DefinePlugin,
  BannerPlugin,
  NormalModuleReplacementPlugin,
  IgnorePlugin,
  type ResolveAlias,
} from "@rspack/core";
import path from "path";
import {
  distOutputPath,
  adapterOutputPath,
  cloudflareOutputPath,
  resolveXmcpSrcPath,
} from "@/utils/constants";
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
import fs from "fs";

interface GetRspackConfigOptions {
  onBeforeCompile?: () => Promise<void>;
}

class BeforeCompileSyncPlugin {
  constructor(private readonly onBeforeCompile: () => Promise<void>) {}

  apply(compiler: any) {
    compiler.hooks.beforeCompile.tapPromise(
      "BeforeCompileSyncPlugin",
      async () => {
        await this.onBeforeCompile();
      }
    );
  }
}

/** Creates the bundler configuration that xmcp will use to bundle the user's code */
export function getRspackConfig(
  xmcpConfig: XmcpConfigOutputSchema,
  options: GetRspackConfigOptions = {}
): RspackOptions {
  const processFolder = process.cwd();
  const { mode, platforms } = compilerContext.getContext();

  const isCloudflare = !!platforms.cloudflare;
  const projectZodPath = path.join(processFolder, "node_modules", "zod");
  const zodAliases: ResolveAlias = fs.existsSync(projectZodPath)
    ? {
        zod: projectZodPath,
        "zod/v3": path.join(projectZodPath, "v3"),
        "zod/v4-mini": path.join(projectZodPath, "v4-mini"),
      }
    : {};

  const outputPath = isCloudflare
    ? cloudflareOutputPath
    : xmcpConfig.experimental?.adapter
      ? adapterOutputPath
      : distOutputPath;

  const outputFilename = isCloudflare
    ? "worker.js"
    : xmcpConfig.experimental?.adapter
      ? "index.js"
      : "[name].js";

  const xmcpSrcPath = isCloudflare ? resolveXmcpSrcPath() : undefined;
  const nodeBuiltins = [
    "assert",
    "buffer",
    "child_process",
    "cluster",
    "console",
    "constants",
    "crypto",
    "dgram",
    "dns",
    "domain",
    "events",
    "fs",
    "http",
    "https",
    "module",
    "net",
    "os",
    "path",
    "perf_hooks",
    "process",
    "punycode",
    "querystring",
    "readline",
    "repl",
    "stream",
    "string_decoder",
    "sys",
    "timers",
    "tls",
    "tty",
    "url",
    "util",
    "vm",
    "worker_threads",
    "zlib",
  ];
  const nodeBuiltinAliases = nodeBuiltins.reduce<Record<string, string>>(
    (acc, builtin) => {
      acc[`node:${builtin}`] = builtin;
      return acc;
    },
    {}
  );
  const nodeBuiltinFallbacks = nodeBuiltins.reduce<Record<string, false>>(
    (acc, builtin) => {
      acc[builtin] = false;
      acc[`node:${builtin}`] = false;
      return acc;
    },
    {}
  );
  const nodeBuiltinsRegex = new RegExp(
    `^(?:node:)?(${nodeBuiltins.join("|")})$`
  );

  const config: RspackOptions = {
    mode,
    watch: mode === "development",
    devtool: mode === "development" ? "eval-cheap-module-source-map" : false,
    output: {
      filename: outputFilename,
      path: outputPath,
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
        keep:
          xmcpConfig.experimental?.adapter || isCloudflare
            ? undefined
            : path.join(outputPath, "client"),
      },
    },
    target: isCloudflare ? "webworker" : "node",
    externals: isCloudflare ? { async_hooks: "async_hooks" } : getExternals(),
    experiments: isCloudflare ? { outputModule: true } : undefined,
    resolve: {
      fallback: {
        process: false,
        ...(isCloudflare ? nodeBuiltinFallbacks : {}),
      },
      alias: {
        ...nodeBuiltinAliases,
        "xmcp/headers": path.resolve(processFolder, ".xmcp/headers.js"),
        "xmcp/utils": path.resolve(processFolder, ".xmcp/utils.js"),
        "xmcp/plugins/x402":
          isCloudflare && xmcpSrcPath
            ? path.join(xmcpSrcPath, "plugins/x402/index.ts")
            : path.resolve(processFolder, ".xmcp/x402.js"),
        ...(isCloudflare && xmcpSrcPath
          ? {
              "@": xmcpSrcPath,
            }
          : {}),
        ...zodAliases,
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
      isCloudflare ? new IgnorePlugin({ resourceRegExp: nodeBuiltinsRegex }) : null,
      isCloudflare
        ? new NormalModuleReplacementPlugin(/^node:/, (resource) => {
            resource.request = resource.request.replace(/^node:/, "");
          })
        : null,
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
      ...(isCloudflare ? { runtimeChunk: false } : {}),
    },
  };

  // Do not watch the adapter output folder and dist/client, avoid infinite loop
  if (mode === "development" && !xmcpConfig.experimental?.adapter) {
    config.watchOptions = {
      ignored: [adapterOutputPath, path.join(processFolder, "dist/client")],
    };

    if (options.onBeforeCompile) {
      config.plugins!.push(new BeforeCompileSyncPlugin(options.onBeforeCompile));
    }
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
  definedVariables["IS_CLOUDFLARE"] = JSON.stringify(isCloudflare);

  if (isCloudflare) {
    const clientBundles = readClientBundlesFromDisk();
    definedVariables["INJECTED_CLIENT_BUNDLES"] = JSON.stringify(clientBundles);
  } else {
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
