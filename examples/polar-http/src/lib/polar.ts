import { PolarProvider } from "@xmcp-dev/polar";

export const polar = PolarProvider.getInstance({
  type: "sandbox",
  token: process.env.POLAR_TOKEN,
  organizationId: process.env.POLAR_ORGANIZATION_ID,
  productId: process.env.POLAR_PRODUCT_ID,
  eventName: "test_tool_call",
});
