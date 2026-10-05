import {
  BannerPlugin,
  DefinePlugin,
  IgnorePlugin,
  NormalModuleReplacementPlugin,
  optimize,
  ProvidePlugin,
  type ResolveAlias,
  RspackOptions,
} from "@rspack/core";
import fs from "fs";
import path from "path";
import { TsCheckerRspackPlugin } from "ts-checker-rspack-plugin";

import { compilerContext } from "@/compiler/compiler-context";
import { isVercelFunctionBuild } from "@/compiler/runtime-target";
import { XmcpConfigOutputSchema } from "@/runtime-config";
import {
  adapterOutputPath,
  cloudflareOutputPath,
  distOutputPath,
  runtimeFolderPath,
} from "@/utils/constants";

import { getEntries } from "./get-entries";
import { getExternals } from "./get-externals";
import { getInjectedVariables } from "./get-injected-variables";
import {
  CreateTypeDefinitionPlugin,
  EmitPackageJsonTypePlugin,
  InjectRuntimePlugin,
  readClientBundlesFromDisk,
} from "./plugins";
import { SchemaInferencePlugin } from "./plugins/schema-inference";
import { resolveTsconfigPathsToAlias } from "./resolve-tsconfig-paths";

/** Reads the project's package.json "type" field to infer the output format */
function projectPrefersEsm(projectFolder: string): boolean {
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(projectFolder, "package.json"), "utf-8")
    ) as { type?: string };
    return packageJson.type === "module";
  } catch {
    return false;
  }
}

/** Creates the bundler configuration that xmcp will use to bundle the user's code */
export function getRspackConfig(
  xmcpConfig: XmcpConfigOutputSchema
): RspackOptions {
  const processFolder = process.cwd();
  const { mode, platforms } = compilerContext.getContext();

  const isCloudflare = !!platforms.cloudflare;
  const isTanstack = xmcpConfig.experimental?.adapter === "tanstack";
  // Plain Node servers follow the application module type. TanStack and
  // Workers always emit ESM so their host bundlers can follow named exports.
  const projectIsEsm = projectPrefersEsm(processFolder);
  const isEsmOutput =
    !isCloudflare && !xmcpConfig.experimental?.adapter && projectIsEsm;
  const emitModule = isCloudflare || isEsmOutput || isTanstack;
  // Existing Node runtimes are CommonJS, while the generated import registry
  // uses ESM syntax. Parse both when the host app declares ESM. An
  // application package.json with "type": "module" would otherwise put the
  // whole folder under strict ESM parsing. Cloudflare is left alone: its
  // prebuilt worker is genuinely ESM and is its own entry.
  const relaxXmcpModuleType = projectIsEsm && !isCloudflare;
  const projectZodPath = path.join(processFolder, "node_modules", "zod");
  const zodAliases: ResolveAlias = fs.existsSync(projectZodPath)
    ? {
        zod: projectZodPath,
        "zod/v3": path.join(projectZodPath, "v3"),
        "zod/v4-mini": path.join(projectZodPath, "v4-mini"),
      }
    : {};

  const outputPath =
    isCloudflare && !isTanstack
      ? cloudflareOutputPath
      : xmcpConfig.experimental?.adapter
        ? adapterOutputPath
        : distOutputPath;

  const outputFilename =
    isCloudflare && !isTanstack
      ? "worker.js"
      : xmcpConfig.experimental?.adapter
        ? "index.js"
        : "[name].js";

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
    // Workers reject eval(), and TanStack needs to process the adapter module.
    devtool:
      mode === "development"
        ? isTanstack
          ? "source-map"
          : "eval-cheap-module-source-map"
        : false,
    output: {
      filename: outputFilename,
      path: outputPath,
      globalObject: "globalThis",
      ...(emitModule
        ? {
            library: { type: "module" },
            chunkFormat: "module",
            module: true,
          }
        : isVercelFunctionBuild(xmcpConfig)
          ? {
              // The Vercel entry's default export is the request handler
              // itself, and the platform reads `module.exports` as the
              // handler rather than as the entry's module object.
              library: { type: "commonjs2", export: "default" },
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
    externals:
      isCloudflare && !isTanstack
        ? { async_hooks: "async_hooks" }
        : getExternals(isEsmOutput),
    // The node externals preset emits require() for builtins even in module
    // output; disable it for ESM so getExternals handles builtins through
    // externalsType node-commonjs (createRequire) instead. TanStack keeps
    // native imports for Vite to resolve on either deployment target.
    ...(isTanstack
      ? {
          externalsType: "module" as const,
          externalsPresets: { node: false, web: false },
        }
      : isEsmOutput
        ? {
            externalsType: "node-commonjs" as const,
            externalsPresets: { node: false },
          }
        : {}),
    experiments: emitModule ? { outputModule: true } : undefined,
    resolve: {
      // The MCP SDK's runtime shims pick the workerd-compatible JSON Schema
      // validator through the "workerd" exports condition.
      ...(isCloudflare ? { conditionNames: ["workerd", "..."] } : {}),
      fallback: {
        process: false,
        ...(isCloudflare ? nodeBuiltinFallbacks : {}),
      },
      alias: {
        ...nodeBuiltinAliases,
        "xmcp/headers": path.resolve(processFolder, ".xmcp/headers.js"),
        "xmcp/utils": path.resolve(processFolder, ".xmcp/utils.js"),
        "xmcp/plugins/x402": path.resolve(processFolder, ".xmcp/x402.js"),
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
      isCloudflare
        ? new IgnorePlugin({ resourceRegExp: nodeBuiltinsRegex })
        : null,
      isCloudflare
        ? new NormalModuleReplacementPlugin(/^node:/, (resource) => {
            resource.request = resource.request.replace(/^node:/, "");
          })
        : null,
      // The MCP SDK lazy-loads its JSON Schema validator via dynamic import;
      // keep server bundles self-contained instead of emitting async chunks.
      new optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
      new InjectRuntimePlugin(),
      xmcpConfig.experimental?.inferToolSchemas
        ? new SchemaInferencePlugin(
            processFolder,
            runtimeFolderPath,
            () => compilerContext.getContext().toolPaths
          )
        : null,
      isEsmOutput || isTanstack
        ? new EmitPackageJsonTypePlugin("module")
        : null,
      // Existing adapters emit CommonJS; pin them so host apps with
      // "type": "module" don't parse index.js as ESM.
      xmcpConfig.experimental?.adapter && !isTanstack
        ? new EmitPackageJsonTypePlugin("commonjs")
        : null,
      new CreateTypeDefinitionPlugin(),
      xmcpConfig.typescript?.skipTypeCheck ? null : new TsCheckerRspackPlugin(),
    ],
    module: {
      rules: [
        // Strict ESM parsing of .xmcp breaks the folder three ways: the
        // prebuilt runtimes' require() calls are left unresolved, their
        // module.exports assignment goes dead (which strips every export off
        // the adapter bundle), and externalized user files get ESM default
        // interop that the host bundler re-resolving them does not apply.
        // "auto" keeps CommonJS semantics while still allowing the ESM syntax
        // the generated files use.
        ...(relaxXmcpModuleType
          ? [
              {
                test: /\.js$/,
                include: runtimeFolderPath,
                type: "javascript/auto" as const,
              },
            ]
          : []),
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
