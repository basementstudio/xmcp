import { ClientConnections } from "xmcp";

export const clients: ClientConnections = {
  remote: {
    url: "https://test-0-5-2-canary.vercel.app/mcp",
    headers: [
      // Use 'env' for sensitive values - the string is the ENV VAR NAME
      // The generated client will use process.env.X_API_KEY at runtime
      { name: "x-api-key", env: "X_API_KEY" },
      // Use 'value' only for non-sensitive static headers
      // { name: "x-custom", value: "static-value" },
    ],
  },
  playwright: {
    npm: "@playwright/mcp",
  },
};
