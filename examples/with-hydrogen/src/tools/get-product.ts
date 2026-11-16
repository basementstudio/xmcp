import { z } from "zod";
import { getRequestContext, type InferSchema, type ToolMetadata } from "xmcp";
import { getProduct } from "../storefront.server";

export const schema = {
  handle: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/)
    .describe("Product handle from search-products"),
};

export const metadata: ToolMetadata = {
  name: "get-product",
  description: "Get a product by handle, or null if it does not exist.",
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
};

export default async function get(input: InferSchema<typeof schema>) {
  const product = await getProduct(input.handle, getRequestContext().signal);
  return JSON.stringify(product);
}
