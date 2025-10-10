import { type ToolMetadata } from "xmcp";

// openAI widget metadata
const widgetMeta = {
  "openai/outputTemplate": "ui://widget/pizza-albums.html", // this points to your resource
  "openai/widgetAccessible": true,
  "openai/resultCanProduceWidget": true, // this is the text that will be displayed when the tool is invoked
}; // this is the metadata for the widget

// tool metadata
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
    ...widgetMeta,
  },
};

export default async function handler() {
  return {
    _meta: widgetMeta, // mandatory: make sure to return metadata here as well
  };
}
