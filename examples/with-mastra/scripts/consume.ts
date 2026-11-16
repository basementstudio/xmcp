import {
  SHIPPING_TOOL,
  shippingClient,
  shippingTools,
} from "../src/connection";

// Discovers and calls an xmcp tool through Mastra's MCPClient.
const client = shippingClient();
try {
  const tools = await shippingTools(client);
  console.log("Tools:", Object.keys(tools).join(", "));
  const result = await tools[SHIPPING_TOOL].execute!({}, {});
  console.log(JSON.stringify(result, null, 2));
} finally {
  await client.disconnect();
}
