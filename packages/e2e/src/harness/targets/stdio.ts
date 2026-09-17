import {
  StdioClientTransport,
  type StdioServerParameters,
} from "@modelcontextprotocol/client/stdio";
import { appendFileSync } from "node:fs";
import { join } from "node:path";
import { createClient, type ProtocolMode } from "../client-options.js";
import { getTargetCapabilities, type Target } from "../target.js";
import type { Fixture } from "../fixture.js";

export function getStdioLaunch(fixture: Fixture, logName: string) {
  const parameters: StdioServerParameters = {
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
  };
  return {
    parameters,
    onStderrData: (chunk: Buffer) => {
      appendFileSync(join(fixture.directory, `server-${logName}.log`), chunk);
    },
  };
}

export async function startStdioTarget(
  fixture: Fixture,
  mode: ProtocolMode
): Promise<Target> {
  const client = createClient(mode);
  const { parameters, onStderrData } = getStdioLaunch(fixture, mode);
  const transport = new StdioClientTransport(parameters);
  transport.stderr?.on("data", onStderrData);
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
    ...getTargetCapabilities(fixture.spec, mode),
    async close() {
      try {
        await client.close();
      } finally {
        await transport.close();
      }
    },
  };
}
