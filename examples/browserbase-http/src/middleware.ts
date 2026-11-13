import { apiKeyAuthMiddleware } from "xmcp";

export default apiKeyAuthMiddleware({
  validateApiKey: async (key) =>
    Boolean(process.env.MCP_API_KEY?.trim()) && key === process.env.MCP_API_KEY,
});
