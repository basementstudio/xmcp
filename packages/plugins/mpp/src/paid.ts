import { MppToolOptions } from "xmcp/plugins/mpp";
import type { UserToolHandler, PaidHandler } from "./types.js";

/**
 * Mark a tool handler as requiring payment via Stripe MPP
 *
 * @example
 * // Use middleware defaults
 * export default paid(async (args) => { ... });
 *
 * @example
 * // Override amount
 * export default paid({ amount: "5", currency: "usd" }, async (args) => { ... });
 */
export function paid<TArgs, TResult>(
  handler: UserToolHandler<TArgs, TResult>
): PaidHandler<TArgs, TResult>;

export function paid<TArgs, TResult>(
  options: MppToolOptions,
  handler: UserToolHandler<TArgs, TResult>
): PaidHandler<TArgs, TResult>;

export function paid<TArgs, TResult>(
  optionsOrHandler: MppToolOptions | UserToolHandler<TArgs, TResult>,
  maybeHandler?: UserToolHandler<TArgs, TResult>
): PaidHandler<TArgs, TResult> {
  let options: MppToolOptions;
  let handler: UserToolHandler<TArgs, TResult>;

  if (typeof optionsOrHandler === "function") {
    options = {};
    handler = optionsOrHandler;
  } else {
    options = optionsOrHandler;
    handler = maybeHandler!;
  }

  const paidHandler = handler as PaidHandler<TArgs, TResult>;
  paidHandler.__mpp = options;

  return paidHandler;
}
