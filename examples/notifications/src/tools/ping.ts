import { type ToolMetadata } from "xmcp";
import { track } from "../analytics";

export const metadata: ToolMetadata = {
  name: "ping",
  description: "Simple ping tool to verify the server is running",
};

export default function ping() {
  track("tool_invoked", { tool: "ping" });
  return "pong";
}
