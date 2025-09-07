import { type ToolMetadata } from "xmcp";
import { createUIResource } from "@mcp-ui/server";

export const metadata: ToolMetadata = {
  name: "show-remote-dom",
  description: "Creates a UI resource displaying a remote DOM script.",
  annotations: {
    title: "Show Remote DOM",
  },
};

export default function showRemoteDom() {
  const remoteDomScript = `
        const p = document.createElement('ui-text');
        p.textContent = 'This is a remote DOM element from the server.';
        root.appendChild(p);
    `;

  const uiResource = createUIResource({
    uri: "ui://remote-dom-demo",
    content: { type: "remoteDom", script: remoteDomScript, framework: "react" },
    encoding: "text",
  });

  return {
    content: [uiResource],
  };
}
