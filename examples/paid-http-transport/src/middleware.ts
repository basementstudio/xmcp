import { x402Middleware } from "@xmcp-dev/x402";

export default x402Middleware({
  wallet: process.env.X402_WALLET!,
  facilitator: process.env.X402_FACILITATOR ?? "https://x402.org/facilitator",
  defaults: {
    price: "0.01",
    currency: "USDC",
    network: "base-sepolia",
  },
});
