import type { RequestHandler } from "express";
import type { X402Config } from "./types.js";
import { x402Interceptor } from "./interceptor.js";

// Use global to share config between bundles
declare global {
  var __XMCP_X402_CONFIG: X402Config | null | undefined;
  var __XMCP_X402_INTERCEPTOR: typeof x402Interceptor | undefined;
}

// Initialize global if not set
if (global.__XMCP_X402_CONFIG === undefined) {
  global.__XMCP_X402_CONFIG = null;
}

export function x402Middleware(config: X402Config): RequestHandler {
  global.__XMCP_X402_CONFIG = {
    wallet: config.wallet,
    facilitator: config.facilitator ?? "https://x402.org/facilitator",
    defaults: {
      price: config.defaults?.price ?? "0.01",
      currency: config.defaults?.currency ?? "USDC",
      network: config.defaults?.network ?? "base",
      maxPaymentAge: config.defaults?.maxPaymentAge ?? 300,
    },
  };

  // Register interceptor globally for xmcp to pick up
  global.__XMCP_X402_INTERCEPTOR = x402Interceptor;

  return (_req, _res, next) => {
    next();
  };
}

export function getX402Config(): X402Config | null {
  return global.__XMCP_X402_CONFIG ?? null;
}
