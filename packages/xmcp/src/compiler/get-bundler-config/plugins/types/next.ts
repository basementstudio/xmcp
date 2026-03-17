export const nextJsTypeDefinition = `
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
