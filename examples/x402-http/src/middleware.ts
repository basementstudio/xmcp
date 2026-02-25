import { x402Provider } from "@xmcp-dev/x402";

export default x402Provider({
  wallet: process.env.X402_WALLET!,
  facilitator: process.env.X402_FACILITATOR ?? "https://x402.org/facilitator",
  debug: true,
  defaults: {
    price: 0.01,
    currency: "USDC",
    network: "base-sepolia",
  },
});
