import { type ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "ping",
  description: "Simple ping tool to verify the server is running",
};

export default function ping() {
  return "pong";
}
