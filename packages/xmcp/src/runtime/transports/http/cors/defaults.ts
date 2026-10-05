import { CLIENT_INFO_HEADER_NAMES } from "@/types/client-info";

export const DEFAULT_CORS_CONFIG = {
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "mcp-session-id",
    "mcp-protocol-version",
    "mcp-method",
    "mcp-name",
    ...CLIENT_INFO_HEADER_NAMES,
  ],
  exposedHeaders: ["Content-Type", "Authorization", "mcp-session-id"],
  credentials: false,
  maxAge: 86400,
};
