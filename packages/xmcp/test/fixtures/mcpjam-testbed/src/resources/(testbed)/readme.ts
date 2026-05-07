import { type ResourceMetadata } from "xmcp";

export const metadata: ResourceMetadata = {
  name: "readme",
  title: "Testbed README",
  description: "Static text resource for mcpjam conformance tests",
  mimeType: "text/plain",
};

export default function handler() {
  return "mcpjam-testbed readme: tools, resources, and prompts wired up";
}
