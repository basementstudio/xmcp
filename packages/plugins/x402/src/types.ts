import type { X402ToolOptions } from "xmcp/plugins/x402";
import type {
  PaymentRequirements as PaymentRequirementsV2,
  PaymentRequirementsV1,
  PaymentPayload,
} from "@x402/core/types";

export type PaymentRequirements = PaymentRequirementsV2 | PaymentRequirementsV1;

export type { PaymentPayload };

/**
 * Payment context available inside paid tool handlers
 */
export interface X402PaymentContext {
  /** Address that made the payment */
  payer: string;
  /** Amount paid in atomic units */
  amount: string;
  /** Blockchain network used */
  network: string;
  /** Asset/token address */
  asset: string;
  /** Transaction hash (available after settlement) */
  transactionHash?: string;
  /** Tool name that was paid for */
  toolName: string;
}

/**
 * Extra context passed to paid tool handlers
 */
export interface PaidHandlerExtra {
  payment: X402PaymentContext;
}

export interface X402Config {
  /** Wallet address to receive payments */
  wallet: string;
  /** Facilitator URL for payment verification */
  facilitator?: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Default payment settings for all paid tools */
  defaults?: {
    price?: number;
    currency?: string;
    network?: string;
    maxPaymentAge?: number;
  };
}

/**
 * User-defined tool handler function
 */
export type UserToolHandler<TArgs = unknown, TResult = unknown> = (
  args: TArgs,
  extra?: unknown
) => TResult | Promise<TResult>;

/**
 * Tool handler function that receives payment context
 */
export type PaidToolHandler<TArgs = unknown, TResult = unknown> = (
  args: TArgs,
  extra: PaidHandlerExtra
) => TResult | Promise<TResult>;

/**
 * A tool handler wrapped with paid() - includes x402 metadata
 */
export type PaidHandler<TArgs = unknown, TResult = unknown> = PaidToolHandler<
  TArgs,
  TResult
> & {
  __x402: X402ToolOptions;
};
