// ------------------------------------------------------------
// Constants
// ------------------------------------------------------------

/**
 * Default values for CORS config
 */
export const DEFAULT_CORS_CONFIG = {
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "mcp-session-id",
    "mcp-protocol-version",
  ],
  exposedHeaders: ["Content-Type", "Authorization", "mcp-session-id"],
  credentials: false,
  maxAge: 86400,
};

/**
 * Default values for the HTTP transport
 */
export const DEFAULT_HTTP_CONFIG = {
  port: 3001,
  host: "127.0.0.1",
  bodySizeLimit: 1024 * 1024 * 10, // 10MB
  debug: false,
  endpoint: "/mcp",
  cors: DEFAULT_CORS_CONFIG,
};

/**
 * Default values for the STDIO transport
 */
export const DEFAULT_STDIO_CONFIG = {
  debug: false,
};

/**
 * Default values for the tools directory
 */
export const DEFAULT_PATHS_CONFIG = {
  tools: "src/tools",
};

/**
 * Default values for the template config
 */
export const DEFAULT_TEMPLATE_CONFIG = {
  name: "xmcp server",
  description:
    "This MCP server was bootstrapped with xmcp. Click the button below to connect to the endpoint.",
};
