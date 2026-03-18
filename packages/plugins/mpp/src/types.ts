import type { MppToolOptions } from "xmcp/plugins/mpp";
import { z } from "zod";

/**
 * Payment context available inside paid tool handlers
 */
export interface MppPaymentContext {
  /** Unique payment identifier */
  paymentId: string;
  /** Amount charged */
  amount: string;
  /** Currency used */
  currency: string;
  /** Name of the tool being paid for */
  toolName: string;
  /** Raw receipt data from mppx */
  receipt?: unknown;
}

/**
 * Extra context passed to paid tool handlers
 */
export interface MppHandlerExtra {
  payment: MppPaymentContext;
}

export const mppConfigSchema = z.object({
  stripeSecretKey: z.string().min(1),
  mppSecretKey: z.string().optional(),
  paymentMethodTypes: z
    .array(z.string())
    .min(1)
    .optional()
    .default(["card", "link"]),
  debug: z.boolean().optional().default(false),
  defaults: z
    .object({
      amount: z.string().optional().default("1"),
      currency: z.string().optional().default("usd"),
    })
    .optional(),
});

export type MppConfig = z.input<typeof mppConfigSchema>;

export interface MppToolContext {
  toolName: string;
  toolOptions: MppToolOptions;
  config: MppConfig;
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
  extra: MppHandlerExtra
) => TResult | Promise<TResult>;

/**
 * A tool handler wrapped with paid() - includes mpp metadata
 */
export type PaidHandler<TArgs = unknown, TResult = unknown> = PaidToolHandler<
  TArgs,
  TResult
> & {
  __mpp: MppToolOptions;
};
