import type { ClientConnections } from "xmcp";

export const clients: ClientConnections = {
  local: { url: process.env.MCP_URL ?? "http://localhost:3001/mcp" },
};
