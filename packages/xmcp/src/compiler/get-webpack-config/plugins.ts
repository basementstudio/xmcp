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
export type VerifyToken = (req: Request, bearerToken?: string) => Promise<AuthInfo | undefined>;
export type Options = {
  required?: boolean;
  requiredScopes?: string[];
  resourceMetadataPath?: string;
};
export type AuthConfig = {
  verifyToken: VerifyToken;
  options?: Options;
};
export type AuthInfo = {
  token: string;
  clientId: string;
  scopes: string[];
  expiresAt?: number;
  resource?: URL;
  extra?: Record<string, unknown>;
};
`;

const expressTypeDefinition = `
export const xmcpHandler: (req: Request, res: Response) => Promise<void>;
`;

const nestjsTypeDefinition = `
export const xmcpHandler: (req: Request, res: Response) => Promise<void>;
export class XmcpController {
  static handleMcpRequest(req: Request, res: Response): Promise<void>;
}
export function XmcpEndpoint(): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export function withAuth(handler: (req: Request, res: Response) => Promise<void>, config: AuthConfig): (req: Request, res: Response) => Promise<void>;
export interface AuthConfig {
  verifyToken: (req: Request, bearerToken?: string) => Promise<any>;
  required?: boolean;
  requiredScopes?: string[];
}
export function createXmcpMiddleware(): (req: Request, res: Response, next: any) => void;
export class XmcpException extends Error {
  constructor(message: string, code?: number, statusCode?: number);
  code: number;
  statusCode: number;
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

        // TO DO add withAuth to the type definition & AuthConfig
        if (xmcpConfig.experimental?.adapter) {
          let typeDefinitionContent = "";
          if (xmcpConfig.experimental?.adapter == "nextjs") {
            typeDefinitionContent = nextJsTypeDefinition;
          } else if (xmcpConfig.experimental?.adapter == "express") {
            typeDefinitionContent = expressTypeDefinition;
          } else if (xmcpConfig.experimental?.adapter == "nestjs") {
            typeDefinitionContent = nestjsTypeDefinition;
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
