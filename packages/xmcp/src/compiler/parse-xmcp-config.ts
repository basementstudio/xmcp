import fs from "fs";
import path from "path";
import { z } from "zod";
import { webpack, type Configuration } from "webpack";
import { createFsFromVolume, Volume } from "memfs";
import { compilerContext } from "./compiler-context";

export const DEFAULT_HTTP_PORT = 3002;
export const DEFAULT_HTTP_BODY_SIZE_LIMIT = 1024 * 1024 * 10; // 10MB
export const DEFAULT_HTTP_ENDPOINT = "/mcp";
export const DEFAULT_HTTP_STATELESS = true;

export const DEFAULT_TOOLS_DIR = "src/tools";

// cors config schema
const corsConfigSchema = z.union([
  z.object({
    origin: z.union([z.string(), z.array(z.string()), z.boolean()]).optional(),
    methods: z.union([z.string(), z.array(z.string())]).optional(),
    allowedHeaders: z.union([z.string(), z.array(z.string())]).optional(),
    exposedHeaders: z.union([z.string(), z.array(z.string())]).optional(),
    credentials: z.boolean().optional(),
    maxAge: z.number().optional(),
  }),
  z.literal(true),
]);

// oauth endpoints schema
const oauthEndpointsSchema = z.object({
  authorizationUrl: z.string(),
  tokenUrl: z.string(),
  revocationUrl: z.string().optional(),
  userInfoUrl: z.string().optional(),
  registerUrl: z.string(),
});

// oauth config schema
const oauthConfigSchema = z.object({
  endpoints: oauthEndpointsSchema,
  issuerUrl: z.string(),
  baseUrl: z.string(),
  serviceDocumentationUrl: z.string().optional(),
  pathPrefix: z.string().default("/oauth2"),
  defaultScopes: z.array(z.string()).default(["openid", "profile", "email"]),
});

// adapter config schema
const adapterConfigSchema = z.enum(["express", "nextjs"]);

// experimental features schema
const experimentalConfigSchema = z.object({
  oauth: oauthConfigSchema.optional(),
  adapter: adapterConfigSchema.optional(),
});

// paths config
const pathsConfigSchema = z.object({
  tools: z.string().default(DEFAULT_TOOLS_DIR),
  // to do add resources prompts etc
});

// TODO extract all this config and schemas to a separate file
const configSchema = z.object({
  stdio: z.boolean().optional(),
  http: z
    .union([
      z.boolean(),
      z.object({
        port: z.number().default(DEFAULT_HTTP_PORT),
        bodySizeLimit: z.number().default(DEFAULT_HTTP_BODY_SIZE_LIMIT),
        debug: z.boolean().default(false),
        endpoint: z.string().default(DEFAULT_HTTP_ENDPOINT),
        cors: corsConfigSchema.optional(),
      }),
    ])
    .optional(),
  experimental: experimentalConfigSchema.optional(),
  paths: pathsConfigSchema.optional().default({
    tools: DEFAULT_TOOLS_DIR,
  }),
  webpack: z.function().args(z.any()).returns(z.any()).optional(),
});

type InputSchema = z.input<typeof configSchema>;
type OutputSchema = z.output<typeof configSchema>;

/** Config type for the user to provide */
export type XmcpInputConfig = Omit<InputSchema, "webpack"> & {
  webpack?: (config: Configuration) => Configuration;
};

/** Config with defaults applied */
export type XmcpParsedConfig = Omit<OutputSchema, "webpack"> & {
  webpack?: (config: Configuration) => Configuration;
};

function validateConfig(config: unknown): XmcpParsedConfig {
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
export async function getConfig(): Promise<XmcpParsedConfig> {
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
export async function readConfig(): Promise<XmcpParsedConfig> {
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
    paths: {
      tools: DEFAULT_TOOLS_DIR,
    },
  } satisfies XmcpInputConfig;
}

/**
 * If the user is using a typescript config file,
 * we need to bundle it, run it and return its copiled code
 * */
async function compileConfig(): Promise<XmcpParsedConfig> {
  const configPath = path.resolve(process.cwd(), configPaths.ts);

  // Create memory filesystem
  const memoryFs = createFsFromVolume(new Volume());

  // Webpack configuration
  const webpackConfig: Configuration = {
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
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: {
            loader: "swc-loader",
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
    const compiler = webpack(webpackConfig);

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
          // Handle webpack require
          if (id === "webpack") {
            return webpack;
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
