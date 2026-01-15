export interface X402ToolOptions {
  price?: number;
  currency?: string;
  network?: string;
  receipt?: boolean;
  maxPaymentAge?: number;
  description?: string;
}

export interface PaidHandler {
  __x402: X402ToolOptions;
}

declare global {
  var __XMCP_X402_REGISTRY: Map<string, X402ToolOptions> | undefined;
}

export function isPaidHandler(handler: unknown): handler is PaidHandler {
  return typeof handler === "function" && "__x402" in handler;
}

export function getX402Registry(): Map<string, X402ToolOptions> | undefined {
  return global.__XMCP_X402_REGISTRY;
}
