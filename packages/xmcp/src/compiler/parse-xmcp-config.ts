import fs from "fs";
import path from "path";
import { createFsFromVolume, Volume } from "memfs";
import { compilerContext } from "./compiler-context";
import {
  configSchema,
  XmcpConfigInputSchema,
  type XmcpConfigOuputSchema,
} from "./config";
import { DEFAULT_PATHS_CONFIG } from "./config/constants";
import rspack, { RspackOptions } from "@rspack/core";

function validateConfig(config: unknown): XmcpConfigOuputSchema {
  return configSchema.parse(config);
}

// read if exists
function readConfigFile(pathToConfig: string): string | null {
  const configPath = path.resolve(process.cwd(), pathToConfig);
  if (!fs.existsSync(configPath)) {
    return null;
  }
  return fs.readFileSync(configPath, "utf8");
}

const configPaths = {
  ts: "xmcp.config.ts",
  json: "xmcp.config.json",
};

/**
 * Parse and validate xmcp config file
 */
export async function getConfig(): Promise<XmcpConfigOuputSchema> {
  const config = await readConfig();
  const { platforms } = compilerContext.getContext();
  if (platforms.vercel) {
    // Remove stdio to deploy on vercel
    delete config.stdio;
  }
  return config;
}

/**
 * Read config from file or return default
 */
export async function readConfig(): Promise<XmcpConfigOuputSchema> {
  // Simple json config
  const jsonFile = readConfigFile(configPaths.json);
  if (jsonFile) {
    return validateConfig(JSON.parse(jsonFile));
  }

  // TypeScript config, compile it
  const tsFile = readConfigFile(configPaths.ts);
  if (tsFile) {
    try {
      return await compileConfig();
    } catch (error) {
      throw new Error(`Failed to compile xmcp.config.ts:\n${error}`);
    }
  }

  // Default config
  return {
    stdio: true,
    http: true,
    paths: DEFAULT_PATHS_CONFIG,
  } satisfies XmcpConfigInputSchema;
}

/**
 * If the user is using a typescript config file,
 * we need to bundle it, run it and return its copiled code
 * */
async function compileConfig(): Promise<XmcpConfigOuputSchema> {
  const configPath = path.resolve(process.cwd(), configPaths.ts);

  // Create memory filesystem
  const memoryFs = createFsFromVolume(new Volume());

  // Webpack configuration
  const rspackConfig: RspackOptions = {
    mode: "production",
    entry: configPath,
    target: "node",
    output: {
      path: "/",
      filename: "config.js",
      library: {
        type: "commonjs2",
      },
    },
    resolve: {
      extensions: [".ts", ".js"],
    },
    resolveLoader: {
      modules: [
        "node_modules",
        path.resolve(__dirname, "../node_modules"), // for monorepo/npm
        path.resolve(__dirname, "../.."), // for pnpm
      ],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: {
            loader: "builtin:swc-loader",
            options: {
              jsc: {
                parser: {
                  syntax: "typescript",
                },
                target: "es2020",
              },
              module: {
                type: "commonjs",
              },
            },
          },
          exclude: /node_modules/,
        },
      ],
    },
    externals: {
      webpack: "commonjs2 webpack",
    },
  };

  return new Promise((resolve, reject) => {
    const compiler = rspack(rspackConfig);

    if (!compiler) {
      reject(new Error("Failed to create rspack compiler"));
      return;
    }

    // Use memory filesystem for output
    compiler.outputFileSystem = memoryFs as any;

    compiler.run((err, stats) => {
      if (err) {
        reject(err);
        return;
      }

      if (stats?.hasErrors()) {
        reject(new Error(stats.toString({ colors: false, errors: true })));
        return;
      }

      try {
        // Read the bundled code from memory
        const bundledCode = memoryFs.readFileSync(
          "/config.js",
          "utf8"
        ) as string;

        // Create a temporary module to evaluate the bundled code
        const module = { exports: {} };
        const require = (id: string) => {
          // Handle rspack require
          if (id === "rspack") {
            return rspack;
          }
          throw new Error(`Cannot resolve module: ${id}`);
        };

        // Evaluate the bundled code
        const func = new Function(
          "module",
          "exports",
          "require",
          "__filename",
          "__dirname",
          bundledCode
        );
        func(
          module,
          module.exports,
          require,
          configPath,
          path.dirname(configPath)
        );

        // Extract the config - it could be default export or direct export
        const configExport = (module.exports as any).default || module.exports;
        const config =
          typeof configExport === "function" ? configExport() : configExport;

        resolve(validateConfig(config));
      } catch (evalError) {
        reject(evalError);
      }
    });
  });
}
