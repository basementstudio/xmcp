import type { XmcpConfig } from "xmcp";

export default {
  // edit-image accepts up to four ~5 MB images as base64 (about 28 MB of
  // JSON), above xmcp's 10 MB default request body limit.
  http: { bodySizeLimit: 30 * 1024 * 1024 },
  paths: { tools: "./src/tools", prompts: false, resources: false },
} satisfies XmcpConfig;
