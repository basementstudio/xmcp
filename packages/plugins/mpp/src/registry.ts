import { MppToolOptions } from "xmcp/plugins/mpp";

// Declare global to share registry between bundles
declare global {
  var __XMCP_MPP_REGISTRY: Map<string, MppToolOptions> | undefined;
}

// Singleton Map using global to share across bundles
if (!global.__XMCP_MPP_REGISTRY) {
  global.__XMCP_MPP_REGISTRY = new Map<string, MppToolOptions>();
}

export const mppRegistry = {
  register(name: string, options: MppToolOptions): void {
    global.__XMCP_MPP_REGISTRY!.set(name, options);
  },

  get(name: string): MppToolOptions | undefined {
    return global.__XMCP_MPP_REGISTRY!.get(name);
  },

  has(name: string): boolean {
    return global.__XMCP_MPP_REGISTRY!.has(name);
  },

  clear(): void {
    global.__XMCP_MPP_REGISTRY!.clear();
  },
};
