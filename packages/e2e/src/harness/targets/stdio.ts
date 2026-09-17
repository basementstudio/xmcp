import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { appendFileSync } from "node:fs";
import { join } from "node:path";
import { createClient, type ProtocolMode } from "../client-options.js";
import { BASE_CAPABILITIES, type Target } from "../target.js";
import type { Fixture } from "../fixture.js";

export async function startStdioTarget(
  fixture: Fixture,
  mode: ProtocolMode
): Promise<Target> {
  const client = createClient(mode);
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [join(fixture.directory, "dist/stdio.js")],
    cwd: fixture.directory,
    stderr: "pipe",
    env: {
      ...Object.fromEntries(
        Object.entries(process.env).filter(
          (entry): entry is [string, string] => entry[1] !== undefined
        )
      ),
      XMCP_TELEMETRY_DISABLED: "true",
    },
  });
  transport.stderr?.on("data", (chunk) =>
    appendFileSync(join(fixture.directory, `server-${mode}.log`), chunk)
  );
  try {
    await client.connect(transport);
  } catch (error) {
    await transport.close();
    throw error;
  }
  return {
    fixture,
    mode,
    client,
    capabilities: new Set(BASE_CAPABILITIES),
    async close() {
      try {
        await client.close();
      } finally {
        await transport.close();
      }
    },
  };
}
