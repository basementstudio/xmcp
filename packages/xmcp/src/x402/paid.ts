import type {
  X402ToolOptions,
  UserToolHandler,
  PaidHandler,
} from "@/types/x402";

/**
 * Mark a tool handler as requiring payment
 *
 * @example
 * // Use middleware defaults
 * export default paid(async (args) => { ... });
 *
 * @example
 * // Override price
 * export default paid({ price: "0.10" }, async (args) => { ... });
 */
export function paid<TArgs, TResult>(
  handler: UserToolHandler<TArgs, TResult>
): PaidHandler<TArgs, TResult>;

export function paid<TArgs, TResult>(
  options: X402ToolOptions,
  handler: UserToolHandler<TArgs, TResult>
): PaidHandler<TArgs, TResult>;

export function paid<TArgs, TResult>(
  optionsOrHandler: X402ToolOptions | UserToolHandler<TArgs, TResult>,
  maybeHandler?: UserToolHandler<TArgs, TResult>
): PaidHandler<TArgs, TResult> {
  let options: X402ToolOptions;
  let handler: UserToolHandler<TArgs, TResult>;

  if (typeof optionsOrHandler === "function") {
    options = {};
    handler = optionsOrHandler;
  } else {
    options = optionsOrHandler;
    handler = maybeHandler!;
  }

  const paidHandler = handler as PaidHandler<TArgs, TResult>;
  paidHandler.__x402 = options;

  return paidHandler;
}

export function isPaidHandler(handler: unknown): handler is PaidHandler {
  return typeof handler === "function" && "__x402" in handler;
}
