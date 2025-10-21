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
    openai: {
      toolInvocation: {
        invoking: "Hand-tossing an album...",
        invoked: "Served a fresh album!",
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
