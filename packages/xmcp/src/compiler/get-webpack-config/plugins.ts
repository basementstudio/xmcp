import { adapterOutputPath, runtimeFolderPath } from "@/utils/constants";
import fs from "fs-extra";
import path from "path";
import { Compiler } from "webpack";
import { getXmcpConfig } from "../compiler-context";

// @ts-expect-error: injected by compiler
export const runtimeFiles = RUNTIME_FILES as Record<string, string>;

export class InjectRuntimePlugin {
  apply(compiler: Compiler) {
    let hasRun = false;
    compiler.hooks.beforeCompile.tap(
      "InjectRuntimePlugin",
      (_compilationParams) => {
        if (hasRun) return;
        hasRun = true;

        for (const [fileName, fileContent] of Object.entries(runtimeFiles)) {
          fs.writeFileSync(path.join(runtimeFolderPath, fileName), fileContent);
        }
      }
    );
  }
}

const nextJsTypeDefinition = `
export const xmcpHandler: (req: Request) => Promise<Response>;
export const withAuth: (handler: (req: Request) => Promise<Response>, authConfig: AuthConfig) => (req: Request) => Promise<Response>;
export const protectedResourceHandler: ({authorizationServers}: {authorizationServers: string[]}) => (req: Request) => Response;
export const metadataCorsOptionsRequestHandler: () => (req: Request) => Response;
export const tools: () => Promise<Tool[]>;
export const toolRegistry: () => Promise<Record<string, ToolRegistryEntry>>;
export type VerifyToken = (req: Request, bearerToken?: string) => Promise<AuthInfo | undefined>;
export type Options = {
  required?: boolean;
  requiredScopes?: string[];
  resourceMetadataPath?: string;
};
export type AuthConfig = Options & {
  verifyToken: VerifyToken;
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
