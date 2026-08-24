/**
 * This script builds the runtime files. It's not the compiler itself.
 */

import path from "path";
import { fileURLToPath } from "url";
import { TsCheckerRspackPlugin } from "ts-checker-rspack-plugin";
import { rspack, RspackOptions, EntryObject } from "@rspack/core";
import { runtimeOutputPath, srcPath } from "./constants";
import chalk from "chalk";
import { runCompiler } from "./compiler-manager";
import fs from "fs-extra";

const mode =
  process.env.NODE_ENV === "production" ? "production" : "development";

interface RuntimeRoot {
  name: string;
  path: string;
}

// Node.js runtime roots (adapters + transports)
const runtimeRoots: RuntimeRoot[] = [
  { name: "headers", path: "headers" },
  { name: "stdio", path: "transports/stdio" },
  { name: "http", path: "transports/http" },
  { name: "adapter-express", path: "adapters/express" },
  { name: "adapter-nextjs", path: "adapters/nextjs" },
  { name: "adapter-nestjs", path: "adapters/nestjs" },
  { name: "adapter-fastify", path: "adapters/fastify" },
];

const entry: EntryObject = {};
for (const root of runtimeRoots) {
  entry[root.name] = path.join(srcPath, "runtime", root.path);
}

// Node.js runtime bundle config
const config: RspackOptions = {
  name: "runtime-node",
  entry,
  mode: "production",
  devtool: false,
  target: "node",
  externalsPresets: { node: true },
  externals: {
    "@rspack/core": "@rspack/core",
    "@nestjs/common": "@nestjs/common",
    fastify: "fastify",
  },
  output: {
    filename: "[name].js",
    path: runtimeOutputPath,
    globalObject: "this",
    library: {
      type: "umd",
    },
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
                tsx: false,
                decorators: true,
              },
              transform: {
                legacyDecorator: true,
                decoratorMetadata: true,
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
      "xmcp/plugins/x402": path.join(srcPath, "plugins/x402"),
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
    new TsCheckerRspackPlugin(),
    // The MCP SDK lazy-loads its JSON Schema validator via dynamic import;
    // keep runtime bundles self-contained (they get re-bundled by user builds).
    new rspack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
  ],
  watch: mode === "development",
};

// Node.js built-ins that are not available on Cloudflare Workers.
// Mirrors the list the compiler uses when bundling user code for `--cf`.
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
const nodeBuiltinsRegex = new RegExp(`^(?:node:)?(${nodeBuiltins.join("|")})$`);

/**
 * Cloudflare Workers runtime bundle config.
 *
 * The published `xmcp` package ships only `dist/`, so the Cloudflare worker
 * runtime has to be prebuilt here, the same way the Node.js transports and
 * adapters above are. The compiler copies `dist/runtime/cloudflare-worker.js`
 * into the user's `.xmcp/` folder and uses it as the `--cf` build entry.
 *
 * The bundle is emitted as ESM so the worker's `export default { fetch }`
 * survives re-bundling by the user build. Injected globals (HTTP_CONFIG,
 * TEMPLATE_CONFIG, INJECTED_MIDDLEWARE, INJECTED_TOOLS, IS_CLOUDFLARE, ...)
 * are left as free identifiers for the compiler's Define/Provide plugins,
 * exactly like in `http.js`.
 */
const cloudflareConfig: RspackOptions = {
  name: "runtime-cloudflare",
  entry: {
    "cloudflare-worker": path.join(
      srcPath,
      "runtime/platforms/cloudflare/worker.ts"
    ),
  },
  mode: "production",
  devtool: false,
  target: "webworker",
  // AsyncLocalStorage is provided by workerd (nodejs_compat); the user build
  // keeps it external as well.
  externals: { async_hooks: "async_hooks" },
  experiments: { outputModule: true },
  output: {
    filename: "[name].js",
    path: runtimeOutputPath,
    globalObject: "globalThis",
    library: { type: "module" },
    chunkFormat: "module",
    module: true,
    // The Node.js runtime build above owns `clean` for this folder.
    clean: false,
  },
  module: config.module,
  resolve: {
    // The MCP SDK's runtime shims pick the workerd-compatible JSON Schema
    // validator through the "workerd" exports condition.
    conditionNames: ["workerd", "..."],
    extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
    fallback: {
      process: false,
      ...nodeBuiltinFallbacks,
    },
    alias: {
      ...nodeBuiltinAliases,
      "@": srcPath,
      "xmcp/plugins/x402": path.join(srcPath, "plugins/x402"),
    },
  },
  watchOptions: {
    aggregateTimeout: 600,
    ignored: /node_modules/,
  },
  optimization: {
    minimize: true,
    splitChunks: false,
    runtimeChunk: false,
  },
  // The bundle is an intermediate artifact re-bundled by user builds.
  performance: false,
  plugins: [
    new rspack.IgnorePlugin({ resourceRegExp: nodeBuiltinsRegex }),
    new rspack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
      resource.request = resource.request.replace(/^node:/, "");
    }),
    new rspack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
  ],
  watch: mode === "development",
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fix issues with importing unsupported modules
// Ignore platform-specific and native binary modules
if (process.platform !== "darwin") {
  config.plugins?.push(
    new rspack.IgnorePlugin({
      resourceRegExp: /^fsevents$/,
    })
  );
}

let compileStarted = false;

// ✨
export function buildRuntime(onCompiled: (stats: any) => void) {
  console.log(chalk.bgGreen.bold("Starting runtime compilation"));

  const handleStats = (err: Error | null, stats: any) => {
    if (err) {
      console.error("Runtime build error:", err);
      return;
    }

    if (stats?.hasErrors()) {
      console.error(
        "Runtime build errors:",
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

    if (process.env.GENERATE_STATS === "true" && stats) {
      const statsJson = stats.toJson({
        all: false,
        assets: true,
        chunks: true,
        modules: true,
        reasons: true,
        timings: true,
      });
      const statsPath = path.join(__dirname, "..", "stats-runtime.json");
      fs.writeFileSync(statsPath, JSON.stringify(statsJson, null, 2));
      console.log(chalk.green(`Saved runtime stats to ${statsPath}`));
    }

    if (!compileStarted) {
      compileStarted = true;
      console.log(chalk.bgGreen.bold("xmcp runtime compiled"));

      buildCloudflareRuntime(() => onCompiled(stats));
    }
  };

  runCompiler(config, handleStats);
}

let cloudflareCompileStarted = false;

function buildCloudflareRuntime(onCompiled: () => void) {
  console.log(chalk.bgGreen.bold("Starting cloudflare runtime compilation"));

  const handleStats = (err: Error | null, stats: any) => {
    if (err) {
      console.error("Cloudflare runtime build error:", err);
      return;
    }

    if (stats?.hasErrors()) {
      console.error(
        "Cloudflare runtime build errors:",
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

    if (!cloudflareCompileStarted) {
      cloudflareCompileStarted = true;
      console.log(chalk.bgGreen.bold("xmcp cloudflare runtime compiled"));
      onCompiled();
    }
  };

  runCompiler(cloudflareConfig, handleStats);
}
