import { adapterOutputPath, runtimeFolderPath } from "@/utils/constants";
import fs from "fs-extra";
import path from "path";
import { Compiler } from "@rspack/core";
import { getXmcpConfig } from "../compiler-context";
import { XmcpConfigOutputSchema } from "@/compiler/config";

// @ts-expect-error: injected by compiler
export const runtimeFiles = RUNTIME_FILES as Record<string, string>;

/**
 * Determines which runtime files are needed based on user configuration.
 */
function getNeededRuntimeFiles(xmcpConfig: XmcpConfigOutputSchema): string[] {
  const neededFiles: string[] = [];

  // headers included if http is configured
  if (xmcpConfig.http) {
    neededFiles.push("headers.js");
  }

  if (xmcpConfig.stdio) {
    neededFiles.push("stdio.js");
  }

  if (xmcpConfig.http) {
    if (xmcpConfig.experimental?.adapter === "express") {
      neededFiles.push("adapter-express.js");
    } else if (xmcpConfig.experimental?.adapter === "nextjs") {
      neededFiles.push("adapter-nextjs.js");
    } else {
      neededFiles.push("http.js");
    }
  }

  return neededFiles;
}

export class InjectRuntimePlugin {
  apply(compiler: Compiler) {
    let hasRun = false;
    compiler.hooks.beforeCompile.tap(
      "InjectRuntimePlugin",
      (_compilationParams) => {
        if (hasRun) return;
        hasRun = true;

        const xmcpConfig = getXmcpConfig();
        const neededFiles = getNeededRuntimeFiles(xmcpConfig);

        for (const [fileName, fileContent] of Object.entries(runtimeFiles)) {
          if (neededFiles.includes(fileName)) {
            fs.writeFileSync(
              path.join(runtimeFolderPath, fileName),
              fileContent
            );
          }
        }
      }
    );
  }
}

const nextJsTypeDefinition = `
export const xmcpHandler: (req: Request) => Promise<Response>;
export const withAuth: (handler: (req: Request) => Promise<Response>, authConfig: AuthConfig) => (req: Request) => Promise<Response>;
export const resourceMetadataHandler: ({authorizationServers}: {authorizationServers: string[]}) => (req: Request) => Response;
export const resourceMetadataOptions: (req: Request) => Response;
export const tools: () => Promise<Tool[]>;
export const toolRegistry: () => Promise<Record<string, ToolRegistryEntry>>;
export type VerifyToken = (req: Request, bearerToken?: string) => Promise<AuthInfo | undefined>;
export type AuthConfig = {
  verifyToken: VerifyToken;
  required?: boolean;
  requiredScopes?: string[];
};
export type AuthInfo = {
  token: string;
  clientId: string;
  scopes: string[];
  expiresAt?: number;
  resource?: URL;
  extra?: Record<string, unknown>;
};
export type OAuthProtectedResourceMetadata = {
  resource: string;
  authorization_servers: string[];
  bearer_methods_supported?: string[];
  resource_documentation?: string;
  introspection_endpoint?: string;
  revocation_endpoint?: string;
  [key: string]: unknown;
};
export type Tool = {
  path: string;
  name: string;
  metadata: {
    name: string;
    description: string;
    annotations?: {
      title?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  schema: Record<string, any>;
  handler: (args: any) => Promise<any>;
};
export type ToolRegistryEntry = {
  description: string;
  inputSchema: any; // Zod schema object
  execute: (args: any) => Promise<any>;
};

`;

const expressTypeDefinition = `
export const xmcpHandler: (req: Request, res: Response) => Promise<void>;
`;

export class CreateTypeDefinitionPlugin {
  apply(compiler: Compiler) {
    let hasRun = false;
    compiler.hooks.afterEmit.tap(
      "CreateTypeDefinitionPlugin",
      (_compilationParams) => {
        if (hasRun) return;
        hasRun = true;

        const xmcpConfig = getXmcpConfig();

        // Manually type the .xmcp/adapter/index.js file using a .xmcp/adapter/index.d.ts file
        if (xmcpConfig.experimental?.adapter) {
          let typeDefinitionContent = "";
          if (xmcpConfig.experimental?.adapter == "nextjs") {
            typeDefinitionContent = nextJsTypeDefinition;
          } else if (xmcpConfig.experimental?.adapter == "express") {
            typeDefinitionContent = expressTypeDefinition;
          }
          fs.writeFileSync(
            path.join(adapterOutputPath, "index.d.ts"),
            typeDefinitionContent
          );
        }
      }
    );
  }
}

interface InjectClientBundlesPluginOptions {
  clientBundlesPath: string;
}

export class InjectClientBundlesPlugin {
  private clientBundlesPath: string;

  constructor(options: InjectClientBundlesPluginOptions) {
    this.clientBundlesPath = options.clientBundlesPath;
  }

  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap("InjectClientBundles", (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: "InjectClientBundles",
          stage: compiler.rspack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        (assets) => {
          let bundles: Record<string, string> = {};

          if (fs.existsSync(this.clientBundlesPath)) {
            const files = fs.readdirSync(this.clientBundlesPath);
            for (const file of files) {
              if (file.endsWith(".bundle.js")) {
                const toolName = file.replace(".bundle.js", "");
                const bundleContent = fs.readFileSync(
                  path.join(this.clientBundlesPath, file),
                  "utf-8"
                );
                bundles[toolName] = bundleContent;
              }
            }
          }

          // Inyecta en todos los archivos JS
          for (const assetName in assets) {
            if (assetName.endsWith(".js")) {
              const source = assets[assetName].source().toString();
              const injected = source.replace(
                /var INJECTED_CLIENT_BUNDLES\s*=\s*[^;]+;/,
                `var INJECTED_CLIENT_BUNDLES = ${JSON.stringify(bundles)};`
              );
              assets[assetName] = new compiler.rspack.sources.RawSource(
                injected
              );
            }
          }
        }
      );
    });
  }
}
