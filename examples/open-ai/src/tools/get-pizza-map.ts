import { type ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "get-pizza-map",
  description: "Show Pizza Map",
  annotations: {
    title: "Pizza Map",
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
