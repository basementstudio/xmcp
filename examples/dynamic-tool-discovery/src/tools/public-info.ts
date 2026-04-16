import { type ToolMetadata } from "xmcp";

// This tool has no discovery restrictions — it's always visible to all clients.

export const metadata: ToolMetadata = {
  name: "public-info",
  description: "Returns public server information. Always visible.",
  annotations: {
    title: "Public Info",
    readOnlyHint: true,
  },
};

export default async function publicInfo() {
  return "This is a public tool. No authentication required.";
}
