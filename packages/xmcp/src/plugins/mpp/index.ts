export interface MppToolOptions {
  amount?: string;
  currency?: string;
  decimals?: number;
  description?: string;
}

export interface MppPaidHandler {
  __mpp: MppToolOptions;
}

declare global {
  var __XMCP_MPP_REGISTRY: Map<string, MppToolOptions> | undefined;
}

export function isMppPaidHandler(handler: unknown): handler is MppPaidHandler {
  return typeof handler === "function" && "__mpp" in handler;
}

export function getMppRegistry(): Map<string, MppToolOptions> | undefined {
  return global.__XMCP_MPP_REGISTRY;
}
