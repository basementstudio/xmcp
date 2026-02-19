import { type ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "get-pizza-albums",
  description: "Show Pizza Album",
  annotations: {
    title: "Pizza Album",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
  _meta: {
    ui: {
      csp: {
        resourceDomains: ["https://persistent.oaistatic.com"],
      },
    },
  },
};

export default async function handler() {
  return {
    _meta: metadata._meta,
  };
}
