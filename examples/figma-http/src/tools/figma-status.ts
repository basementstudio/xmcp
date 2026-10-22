import type { ToolMetadata } from "xmcp";

import { bridge } from "../bridge";

export const metadata: ToolMetadata = {
  name: "figma-status",
  description:
    "Inspect the connected Figma document and page; obtain the sessionId required for all canvas operations.",
  annotations: { readOnlyHint: true, openWorldHint: false },
};

export default function figmaStatus() {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(bridge.status()) }],
  };
}
