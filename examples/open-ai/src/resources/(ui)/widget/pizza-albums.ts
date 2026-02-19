import { type ResourceMetadata } from "xmcp";

export const metadata: ResourceMetadata = {
  name: "pizza-albums",
  title: "Show Pizza Album",
  mimeType: "text/html;profile=mcp-app",
};

export default async function handler() {
  return `
    <div id="pizzaz-albums-root"></div>
    <link rel="stylesheet" href="https://persistent.oaistatic.com/ecosystem-built-assets/pizzaz-albums-0038.css">
    <script type="module" src="https://persistent.oaistatic.com/ecosystem-built-assets/pizzaz-albums-0038.js"></script>
  `.trim();
}
