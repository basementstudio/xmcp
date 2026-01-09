import type { RequestHandler } from "express";
import { X402Config } from "@/types/x402";

// Use global to share config between bundles (http.js and x402.js)
declare global {
  var __XMCP_X402_CONFIG: X402Config | null | undefined;
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

  return (_req, _res, next) => {
    next();
  };
}

export function getX402Config(): X402Config | null {
  return global.__XMCP_X402_CONFIG ?? null;
}
