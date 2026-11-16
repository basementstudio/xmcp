import { MCPClient } from "@mastra/mcp";
import { required } from "./env";

export const SHIPPING_TOOL = "xmcp_get-shipping-policy";

/** Each caller owns its client and must disconnect it. */
export function shippingClient() {
  return new MCPClient({
    id: `xmcp-shipping-${crypto.randomUUID()}`,
    servers: {
      xmcp: {
        url: new URL(required("MCP_URL")),
        requestInit: {
          headers: { Authorization: `Bearer ${required("MCP_API_KEY")}` },
        },
      },
    },
  });
}

/**
 * Only the read-only policy tool reaches the agent. `ask-agent` is filtered
 * out, so the agent cannot call itself recursively.
 */
export async function shippingTools(client: MCPClient) {
  const tools = await client.listTools();
  const tool = tools[SHIPPING_TOOL];
  if (!tool) throw new Error("Shipping policy tool unavailable");
  return { [SHIPPING_TOOL]: tool };
}
