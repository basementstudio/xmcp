import type { X402Config } from "./types.js";
import { x402Interceptor } from "./interceptor.js";
import { Middleware } from "xmcp";
import { DEFAULT_FACILITATOR_URL } from "./constants.js";

declare global {
  var __XMCP_X402_CONFIG: X402Config | null | undefined;
  var __XMCP_X402_INTERCEPTOR: typeof x402Interceptor | undefined;
}

if (global.__XMCP_X402_CONFIG === undefined) {
  global.__XMCP_X402_CONFIG = null;
}

export function x402Middleware(config: X402Config): Middleware {
  global.__XMCP_X402_CONFIG = {
    wallet: config.wallet,
    facilitator: config.facilitator ?? DEFAULT_FACILITATOR_URL,
    debug: config.debug ?? false,
    defaults: {
      price: config.defaults?.price ?? 0.01,
      currency: config.defaults?.currency ?? "USDC",
      network: config.defaults?.network ?? "base",
      maxPaymentAge: config.defaults?.maxPaymentAge ?? 300,
    },
  };

  global.__XMCP_X402_INTERCEPTOR = x402Interceptor;

  return (_req, _res, next) => {
    next();
  };
}

export function getX402Config(): X402Config | null {
  return global.__XMCP_X402_CONFIG ?? null;
}
