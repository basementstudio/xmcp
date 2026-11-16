import { createMcpConnection } from "@flue/runtime";
import { shippingConnection } from "../src/connection";

// Discovers xmcp tools through Flue's MCP client. Flue runs adapted tools
// inside an agent turn, so call them with `pnpm dev:agent` and a model key.
const connection = await createMcpConnection(shippingConnection());
try {
  for (const tool of connection.tools) {
    console.log(`${tool.name}: ${tool.description}`);
  }
} finally {
  await connection.close();
}
