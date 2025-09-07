import { type ToolMetadata } from "xmcp";
import { createUIResource } from "@mcp-ui/server";

export const metadata: ToolMetadata = {
  name: "show-external-url",
  description:
    "Creates a UI resource displaying an external URL (example.com).",
  annotations: {
    title: "Show External URL",
  },
};

export default function showExternalUrl() {
  const uiResource = createUIResource({
    uri: "ui://greeting",
    content: { type: "externalUrl", iframeUrl: "https://mcpui.dev" },
    encoding: "text",
  });

  return {
    content: [uiResource],
  };
}
