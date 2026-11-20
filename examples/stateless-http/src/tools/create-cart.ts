import type { ToolMetadata } from "xmcp";
import { mintCartHandle } from "../lib/cart-handle";

export const metadata: ToolMetadata = {
  name: "create-cart",
  description:
    "Start an empty cart. Returns a cart handle to pass to add-item and view-cart.",
};

export default function createCart() {
  return { structuredContent: { cart: mintCartHandle([]), items: [] } };
}
