import { PolarProvider } from "@xmcp-dev/polar";

export const POLAR_TOKEN =
  "polar_oat_DGbqf7vVbAW76TbqLeJRs6NhDAB0AArLzLsb62M90xo";
export const POLAR_ORGANIZATION_ID = "b5e6c6d7-6913-4a71-90c7-7dd8ed666752";
export const POLAR_PRODUCT_ID = "a3ba2d9d-0336-40cc-af70-ebb00f83c3a3";

export const polar = PolarProvider.getInstance({
  type: "sandbox",
  token: POLAR_TOKEN,
  organizationId: POLAR_ORGANIZATION_ID,
  baseUrl: "http://127.0.0.1:3002",
  productId: POLAR_PRODUCT_ID,
});
