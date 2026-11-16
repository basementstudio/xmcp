import { apiKeyAuthMiddleware } from "xmcp";
import { isBearer } from "./env";

// Stateless: every HTTP request must carry the bearer token.
export default apiKeyAuthMiddleware({
  headerName: "authorization",
  validateApiKey: async (header) => isBearer(header, process.env.MCP_API_KEY),
});
