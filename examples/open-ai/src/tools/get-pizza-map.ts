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
    openai: {
      toolInvocation: {
        invoking: "Hand-tossing a map...",
        invoked: "Served a fresh map!",
      },
      widgetAccessible: true,
    },
  },
};

export default async function handler() {
  return {
    _meta: metadata._meta,
  };
}
