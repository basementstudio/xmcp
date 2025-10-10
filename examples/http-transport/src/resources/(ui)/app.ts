import { type ResourceMetadata } from "xmcp";

export const metadata: ResourceMetadata = {
  name: "app",
  title: "Application",
  description: "Application configuration data",
  mimeType: "text/html+skybridge",
};

export default async function handler() {
  return {
    contents: [
      {
        text: `
        <div id="pizzaz-root"></div>
        <link rel="stylesheet" href="https://persistent.oaistatic.com/ecosystem-built-assets/pizzaz-0038.css">
        <script type="module" src="https://persistent.oaistatic.com/ecosystem-built-assets/pizzaz-0038.js"></script>
      `.trim(),
        _meta: {
          "openai/widgetDescription": "Application",
          "openai/widgetPrefersBorder": true,
        },
      },
    ],
  };
}
