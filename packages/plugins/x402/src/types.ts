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
  /** Default payment settings for all paid tools */
  defaults?: {
    price?: string;
    currency?: string;
    network?: string;
    maxPaymentAge?: number;
  };
}

/**
 * Options for the paid() wrapper to override middleware defaults
 */
export interface X402ToolOptions {
  price?: string;
  currency?: string;
  network?: string;
  receipt?: boolean;
  maxPaymentAge?: number;
  description?: string;
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
