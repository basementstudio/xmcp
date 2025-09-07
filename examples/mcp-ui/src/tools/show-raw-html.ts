

import { type ToolMetadata } from "xmcp";
import { createUIResource } from "@mcp-ui/server";

export const metadata: ToolMetadata = {
  name: "show-raw-html",
  description: 'Creates a UI resource displaying raw HTML.',
  annotations: {
    title: 'Show Raw HTML',
  }
};

export default function showRawHtml() {
  const uiResource = createUIResource({
      uri: 'ui://raw-html-demo',
      content: { type: 'rawHtml', htmlString: '<h1>Hello from Raw HTML</h1>' },
      encoding: 'text',
  });
  
  return {
    content: [uiResource],
  };
}