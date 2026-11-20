import type { CartItem } from "./cart-handle";

const PRICES_IN_CENTS: Record<string, number> = {
  "tee-black": 2500,
  "tee-white": 2500,
  "cap-logo": 1800,
};

export const SKUS = Object.keys(PRICES_IN_CENTS) as [string, ...string[]];

export function totalInCents(items: CartItem[]) {
  return items.reduce(
    (total, item) => total + PRICES_IN_CENTS[item.sku] * item.quantity,
    0
  );
}
