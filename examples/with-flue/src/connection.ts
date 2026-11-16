import { defineMcpConnection } from "@flue/runtime";
import { required } from "./env";

/**
 * Only the read-only policy tool is adapted. `ask-agent` is never exposed to
 * the agent, so it cannot call itself recursively.
 */
export function shippingConnection() {
  return defineMcpConnection({
    name: "xmcp",
    url: required("MCP_URL"),
    auth: () => required("MCP_API_KEY"),
    tools: ["get-shipping-policy"],
  });
}
