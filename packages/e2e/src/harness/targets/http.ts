import { StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { join } from "node:path";
import { startProcess } from "../process.js";
import {
  createClient,
  CLIENT_INFO,
  type ProtocolMode,
} from "../client-options.js";
import { getTargetCapabilities, type Target } from "../target.js";
import type { Fixture } from "../fixture.js";

export async function startHttpServer(fixture: Fixture, logName: string) {
  const entry = fixture.spec.kind === "http" ? "dist/http.js" : "host.cjs";
  const running = startProcess(
    process.execPath,
    [join(fixture.directory, entry)],
    fixture.directory,
    join(fixture.directory, `server-${logName}.log`)
  );
  try {
    const ready = await running.waitForOutput(
      /(?:E2E_READY |MCP Server running on )(http:\/\/127\.0\.0\.1:\d+\/mcp)/
    );
    return { url: ready[1], close: running.stop, output: running.output };
  } catch (error) {
    await running.stop();
    throw new Error(
      `Cannot start ${fixture.label}/${logName}: ${String(error)}\n${running.output()}`,
      { cause: error }
    );
  }
}

export async function startHttpTarget(
  fixture: Fixture,
  mode: ProtocolMode
): Promise<Target> {
  const server = await startHttpServer(fixture, mode);
  const client = createClient(mode);
  let transport: StreamableHTTPClientTransport | undefined;
  try {
    transport = new StreamableHTTPClientTransport(new URL(server.url), {
      requestInit: {
        headers: {
          "x-mcp-client-name": CLIENT_INFO.name,
          "x-mcp-client-version": CLIENT_INFO.version,
        },
      },
    });
    await client.connect(transport);
    return {
      fixture,
      mode,
      client,
      url: server.url,
      ...getTargetCapabilities(fixture.spec, mode),
      async close() {
        try {
          await client.close();
        } finally {
          await server.close();
        }
      },
    };
  } catch (error) {
    await transport?.close().catch(() => {});
    await server.close();
    throw new Error(
      `Cannot connect to ${fixture.label}/${mode}: ${String(error)}\n${server.output()}`,
      { cause: error }
    );
  }
}
