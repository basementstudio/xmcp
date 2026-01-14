import type { X402ToolOptions } from "xmcp/plugins/x402";
import type {
  PaymentRequirements as PaymentRequirementsV2,
  PaymentRequirementsV1,
  PaymentPayload,
  PaymentPayloadV1,
} from "@x402/core/types";
import { z } from "zod";
import { DEFAULT_FACILITATOR_URL } from "./constants.js";

export type PaymentRequirements = PaymentRequirementsV2 | PaymentRequirementsV1;

export type { PaymentPayload, PaymentPayloadV1 };

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

export const x402ConfigSchema = z.object({
  wallet: z.string(),
  facilitator: z.string().url().optional().default(DEFAULT_FACILITATOR_URL),
  debug: z.boolean().optional().default(false),
  defaults: z
    .object({
      price: z.number().min(0).optional().default(0.01),
      currency: z.string().min(1).max(4).optional().default("USDC"),
      network: z.string().optional().default("base"),
      maxPaymentAge: z.number().min(0).optional().default(300),
    })
    .optional(),
});

export type X402Config = z.input<typeof x402ConfigSchema>;

export interface X402ToolContext {
  toolName: string;
  toolOptions: X402ToolOptions;
  config: X402Config;
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
