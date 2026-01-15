import type { Network } from "@x402/core/types";

export const NETWORKS: Record<
  string,
  { id: Network; usdc: string; explorer: string }
> = {
  base: {
    id: "eip155:8453",
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    explorer: "https://basescan.org",
  },
  "base-sepolia": {
    id: "eip155:84532",
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    explorer: "https://sepolia.basescan.org",
  },
};

export type NetworkName = keyof typeof NETWORKS;

export const USDC_EXTRA = { name: "USDC", version: "2" } as const;

export const DEFAULT_FACILITATOR_URL = "https://x402.org/facilitator";
