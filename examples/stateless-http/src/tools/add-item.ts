import { z } from "zod";
import type { InferSchema, ToolMetadata } from "xmcp";
import { mintCartHandle, readCartHandle } from "../lib/cart-handle";
import { SKUS } from "../lib/catalog";

export const schema = {
  cart: z.string().describe("The cart handle returned by the previous call"),
  sku: z.enum(SKUS).describe("The product to add"),
  quantity: z.number().int().min(1).max(10).describe("How many to add"),
};

export const metadata: ToolMetadata = {
  name: "add-item",
  description:
    "Add a product to a cart. Returns a new cart handle that replaces the one passed in.",
};

export default function addItem({
  cart,
  sku,
  quantity,
}: InferSchema<typeof schema>) {
  const items = [...readCartHandle(cart), { sku, quantity }];
  return { structuredContent: { cart: mintCartHandle(items), items } };
}
