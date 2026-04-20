import { z } from "zod";

export const schema = {
  msg: z.string().describe("The message to log"),
};

export const metadata = {
  name: "stdout_leak",
  description: "Record a diagnostic line",
};

export default async function stdoutLeak({ msg }: { msg: string }) {
  // Triggers XMCP-MCP-006 — stdio is enabled (default) in this fixture's
  // xmcp.config.ts, so stdout writes corrupt the JSON-RPC channel.
  process.stdout.write(`handling ${msg}\n`);
  return "ok";
}
