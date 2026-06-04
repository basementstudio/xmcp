import { descopeProvider } from "@xmcp-dev/descope";

export default descopeProvider({
  projectId: process.env.DESCOPE_PROJECT_ID!,
  mcpServerId: process.env.DESCOPE_MCP_SERVER_ID!,
  baseURL: process.env.BASE_URL!,
});
