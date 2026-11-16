import type { ToolMetadata } from "xmcp";

export const schema = {};

export const metadata: ToolMetadata = {
  name: "get-shipping-policy",
  description: "Read the demonstration store's shipping policy.",
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
};

export default function shippingPolicy() {
  return {
    content: [
      {
        type: "text" as const,
        text: "Standard shipping takes 3–5 business days. Returns are accepted within 30 days.",
      },
    ],
  };
}
