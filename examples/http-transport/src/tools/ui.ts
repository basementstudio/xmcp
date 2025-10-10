import { InferSchema, type ToolMetadata } from "xmcp";
import { z } from "zod";

export const schema = {
  url: z.string().describe("The URL to display"),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "ui",
  description: "Create a UI resource",
  annotations: {
    title: "UI",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
  _meta: {
    "openai/outputTemplate": "ui://app.html",
    "openai/toolInvocation/invoking": "Loading content...",
    "openai/toolInvocation/invoked": "Content loaded",
    "openai/widgetAccessible": true,
    "openai/resultCanProduceWidget": true,
  },
};

// Tool implementation
export default async function ui({ url }: InferSchema<typeof schema>) {
  console.log(url);

  return {
    content: [
      {
        type: "text",
        text: url,
      },
    ],
    _meta: {
      "openai/outputTemplate": "ui://app.html",
      "openai/toolInvocation/invoking": "Loading content...",
      "openai/toolInvocation/invoked": "Content loaded",
      "openai/widgetAccessible": true,
      "openai/resultCanProduceWidget": true,
    },
  };
}
