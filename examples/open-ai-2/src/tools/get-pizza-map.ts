import { type ToolMetadata } from "xmcp";

// openAI widget metadata
// Note: openai/outputTemplate will be auto-generated as "ui://widget/get-pizza-map.html"
const widgetMeta = {
  "openai/toolInvocation/invoking": "Hand-tossing a map",
  "openai/toolInvocation/invoked": "Served a fresh map",
  "openai/widgetAccessible": true,
  "openai/resultCanProduceWidget": true,
};

// tool metadata
export const metadata: ToolMetadata = {
  name: "get-pizza-map",
  description: "Show Pizza Map",
  annotations: {
    title: "Pizza Map",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
  _meta: widgetMeta,
};

// Tool handler returns HTML directly!
// The transformer automatically wraps it with the _meta from metadata
// The resource is auto-generated at "ui://widget/get-pizza-map.html" and serves this HTML (based on tool's name)
export default async function handler() {
  return `
    <div id="pizzaz-root"></div>
    <link rel="stylesheet" href="https://persistent.oaistatic.com/ecosystem-built-assets/pizzaz-0038.css">
    <script type="module" src="https://persistent.oaistatic.com/ecosystem-built-assets/pizzaz-0038.js"></script>
  `.trim();
}
