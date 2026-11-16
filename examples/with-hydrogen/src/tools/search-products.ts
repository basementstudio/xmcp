import { z } from "zod";
import { getRequestContext, type InferSchema, type ToolMetadata } from "xmcp";
import { searchProducts } from "../storefront.server";

export const schema = {
  query: z.string().trim().min(1).max(200).describe("Storefront search query"),
  first: z.number().int().min(1).max(20).default(5),
};

export const metadata: ToolMetadata = {
  name: "search-products",
  description:
    "Search the store catalog. Returns handles, titles, availability, and minimum prices with currency.",
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
};

export default async function search(input: InferSchema<typeof schema>) {
  const products = await searchProducts(
    input.query,
    input.first,
    getRequestContext().signal
  );
  return JSON.stringify(products);
}
