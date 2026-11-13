import type { Network } from "@x402/core/types";

export interface NetworkConfig {
  id: Network;
  /** Asset identifier advertised in payment requirements */
  asset: string;
  /** Decimals used to convert the tool price into atomic units */
  decimals: number;
  extra: Record<string, unknown>;
  explorer: string;
  /** Explorer path prefix for a transaction or block hash */
  explorerTxPath: string;
}

export const USDC_EXTRA = { name: "USDC", version: "2" } as const;

export const NANO_NETWORK_ID = "nano:mainnet";

export const NETWORKS: Record<string, NetworkConfig> = {
  base: {
    id: "eip155:8453",
    asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    decimals: 6,
    extra: USDC_EXTRA,
    explorer: "https://basescan.org",
    explorerTxPath: "/tx/",
  },
  "base-sepolia": {
    id: "eip155:84532",
    asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    decimals: 6,
    extra: USDC_EXTRA,
    explorer: "https://sepolia.basescan.org",
    explorerTxPath: "/tx/",
  },
  nano: {
    id: NANO_NETWORK_ID,
    asset: "XNO",
    decimals: 30,
    extra: { name: "XNO", decimals: 30 },
    explorer: "https://blocklattice.io",
    explorerTxPath: "/block/",
  },
};

export type NetworkName = keyof typeof NETWORKS;

export const DEFAULT_FACILITATOR_URL = "https://x402.org/facilitator";

export const DEFAULT_NANO_RPC_URL = "https://rpc.nano.to";
