import type { X402ToolOptions } from "./types.js";

// Declare global to share registry between bundles
declare global {
  var __XMCP_X402_REGISTRY: Map<string, X402ToolOptions> | undefined;
}

// Singleton Map using global to share across bundles
if (!global.__XMCP_X402_REGISTRY) {
  global.__XMCP_X402_REGISTRY = new Map<string, X402ToolOptions>();
}

export const x402Registry = {
  register(name: string, options: X402ToolOptions): void {
    global.__XMCP_X402_REGISTRY!.set(name, options);
  },

  get(name: string): X402ToolOptions | undefined {
    return global.__XMCP_X402_REGISTRY!.get(name);
  },

  has(name: string): boolean {
    return global.__XMCP_X402_REGISTRY!.has(name);
  },

  clear(): void {
    global.__XMCP_X402_REGISTRY!.clear();
  },
};
