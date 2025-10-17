import { type ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "get-pizza-albums",
  description: "Show Pizza Album",
  _meta: {
    openai: {
      widgetAccessible: true,
      resultCanProduceWidget: true,
    },
  },
};

export default async function handler() {
  return `
    <div id="pizzaz-albums-root"></div>
    <link rel="stylesheet" href="https://persistent.oaistatic.com/ecosystem-built-assets/pizzaz-albums-0038.css">
    <script type="module" src="https://persistent.oaistatic.com/ecosystem-built-assets/pizzaz-albums-0038.js"></script>
  `.trim();
}
