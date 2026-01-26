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
    } else if (xmcpConfig.experimental?.adapter === "nestjs") {
      neededFiles.push("adapter-nestjs.js");
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

const nestJsTypeDefinition = `
import { Request, Response } from "express";
import { Type, CanActivate, DynamicModule } from "@nestjs/common";

// Auth types
export interface AuthInfo {
  token: string;
  clientId: string;
  scopes: string[];
  expiresAt?: number;
  extra?: Record<string, unknown>;
}

export interface McpAuthConfig {
  verifyToken: (token: string) => Promise<Omit<AuthInfo, "token">> | Omit<AuthInfo, "token">;
  required?: boolean;
  requiredScopes?: string[];
}

export declare function createMcpAuthGuard(config: McpAuthConfig): Type<CanActivate>;

// OAuth types
export interface OAuthConfig {
  authorizationServers: string[];
  scopesSupported?: string[];
  bearerMethodsSupported?: string[];
}

export interface OAuthProtectedResourceMetadata {
  resource: string;
  authorizationServers: string[];
  scopesSupported?: string[];
  bearerMethodsSupported?: string[];
}

export declare class OAuthModule {
  static forRoot(config: OAuthConfig): DynamicModule;
}

export declare class OAuthService {
  getResourceMetadata(req: Request): OAuthProtectedResourceMetadata;
}

export declare class OAuthController {
  constructor(oauthService: OAuthService);
  getResourceMetadata(req: Request): OAuthProtectedResourceMetadata;
  handleOptions(res: Response): void;
}

// Utility functions
export declare function buildBaseUrl(req: Request): string;
export declare function buildResourceMetadataUrl(req: Request): string;

// MCP Service & Controller
export declare class XmcpService {
  handleRequest(req: Request & { auth?: AuthInfo }, res: Response): Promise<void>;
}

export declare class XmcpController {
  constructor(xmcpService: XmcpService);
  handleMcp(req: Request, res: Response): Promise<void>;
  handleGet(res: Response): void;
  handleOptions(res: Response): void;
}
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
          } else if (xmcpConfig.experimental?.adapter == "nestjs") {
            typeDefinitionContent = nestJsTypeDefinition;
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
