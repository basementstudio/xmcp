import { ClientConnections } from "xmcp";

export const clients: ClientConnections = {
  context: {
    url: "https://mcp.context7.com/mcp",
    headers: [
      {
        // Use 'env' for sensitive values - the string is the ENV VAR NAME
        // The generated client will use process.env.X_API_KEY at runtime
        name: "CONTEXT7_API_KEY",
        env: "CONTEXT7_API_KEY",
        // Use 'value' only for non-sensitive static headers
        // { name: "x-custom", value: "static-value" },
      },
    ],
  },
  playwright: {
    npm: "@playwright/mcp",
  },
};
