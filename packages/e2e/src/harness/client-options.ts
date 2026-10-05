import { Client } from "@modelcontextprotocol/client";
import { REQUEST_TIMEOUT_MS } from "./constants.js";

export type ProtocolMode = "auto" | "legacy";
export const CLIENT_INFO = { name: "xmcp-conformance", version: "1.0.0" };
export const REQUEST_OPTIONS = { timeout: REQUEST_TIMEOUT_MS };

export function createClient(mode: ProtocolMode) {
  const client = new Client(CLIENT_INFO, {
    versionNegotiation: { mode },
    capabilities: { elicitation: { form: {} } },
  });
  client.setRequestHandler("elicitation/create", async () => ({
    action: "accept" as const,
    content: { confirmed: true },
  }));
  return client;
}
