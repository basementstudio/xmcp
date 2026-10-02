export const tanstackTypeDefinition = `
export interface AuthInfo {
  token: string;
  clientId: string;
  scopes: string[];
  expiresAt?: number;
  resource?: URL;
  extra?: Record<string, unknown>;
}
export interface XmcpHandlerOptions {
  authInfo?: AuthInfo;
}
export declare function xmcpHandler(request: Request, options?: XmcpHandlerOptions): Promise<Response>;
`;
