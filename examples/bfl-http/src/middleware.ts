import { timingSafeEqual } from "node:crypto";
import { apiKeyAuthMiddleware } from "xmcp";

// Stateless: every HTTP request must repeat the client key in x-api-key.
export default apiKeyAuthMiddleware({
  validateApiKey: async (key) => {
    const expected = process.env.MCP_API_KEY?.trim();
    if (!expected) return false;
    const received = Buffer.from(key);
    const wanted = Buffer.from(expected);
    return (
      received.length === wanted.length && timingSafeEqual(received, wanted)
    );
  },
});
