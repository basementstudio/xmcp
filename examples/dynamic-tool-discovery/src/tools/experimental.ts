import { type ToolMetadata } from "xmcp";

// This tool is disabled by default. It won't appear unless the server
// operator explicitly enables it via the config's "enable" or "include" list.
//
// In this example's xmcp.config.ts, it's re-enabled with:
//   tools: { enable: ["experimental"] }

export const metadata: ToolMetadata = {
  name: "experimental",
  description: "An experimental feature, disabled by default.",
  enabled: false,
  annotations: {
    title: "Experimental Feature",
  },
};

export default async function experimental() {
  return "This experimental feature is enabled via server configuration.";
}
