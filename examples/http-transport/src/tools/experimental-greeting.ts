import type { ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "experimental-greeting",
  description: "A greeting that is not available yet",
  tags: ["experimental"],
  enabled: false,
};

export default function experimentalGreeting() {
  return "Hello from the experiment";
}
