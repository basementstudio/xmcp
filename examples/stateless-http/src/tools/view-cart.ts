import { z } from "zod";
import type { InferSchema, ToolMetadata } from "xmcp";
import { readCartHandle } from "../lib/cart-handle";
import { totalInCents } from "../lib/catalog";

export const schema = {
  cart: z.string().describe("The cart handle returned by the previous call"),
};

export const metadata: ToolMetadata = {
  name: "view-cart",
  description: "List the items in a cart and its total",
  annotations: { readOnlyHint: true },
};

export default function viewCart({ cart }: InferSchema<typeof schema>) {
  const items = readCartHandle(cart);
  return { structuredContent: { items, totalInCents: totalInCents(items) } };
}
