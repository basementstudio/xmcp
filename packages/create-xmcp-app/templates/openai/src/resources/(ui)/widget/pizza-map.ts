import { type ResourceMetadata } from "xmcp";

export const metadata: ResourceMetadata = {
  name: "pizza-map",
  title: "Show Pizza Map",
  mimeType: "text/html+skybridge",
};

export default async function handler() {
  return `
    <div id="pizzaz-root"></div>
    <link rel="stylesheet" href="https://persistent.oaistatic.com/ecosystem-built-assets/pizzaz-0038.css">
    <script type="module" src="https://persistent.oaistatic.com/ecosystem-built-assets/pizzaz-0038.js"></script>
  `.trim();
}
