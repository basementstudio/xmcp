import { type ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "get-pizza-map",
  description: "Show Pizza Map",
  _meta: {
    ui: {
      csp: {
        resourceDomains: ["https://persistent.oaistatic.com"],
      },
    },
  },
};

/**
 * Tool handler returns HTML directly
 *
 * How it works:
 * 1. Handler returns HTML string
 * 2. Framework detects widget metadata and wraps response with empty content + _meta
 * 3. Framework auto-generates resource at "ui://app/get-pizza-map.html"
 * 4. Resource serves this HTML when accessed via tool callign
 */
export default async function handler() {
  return `
    <div id="pizzaz-root"></div>
    <link rel="stylesheet" href="https://persistent.oaistatic.com/ecosystem-built-assets/pizzaz-0038.css">
    <script type="module" src="https://persistent.oaistatic.com/ecosystem-built-assets/pizzaz-0038.js"></script>
  `.trim();
}
