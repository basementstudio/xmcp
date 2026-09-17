import { StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { join } from "node:path";
import { startProcess } from "../process.js";
import {
  createClient,
  CLIENT_INFO,
  type ProtocolMode,
} from "../client-options.js";
import { BASE_CAPABILITIES, type Target } from "../target.js";
import type { Fixture } from "../fixture.js";

export async function startHttpTarget(
  fixture: Fixture,
  mode: ProtocolMode
): Promise<Target> {
  const entry = fixture.spec.kind === "http" ? "dist/http.js" : "host.cjs";
  const running = startProcess(
    process.execPath,
    [join(fixture.directory, entry)],
    fixture.directory,
    join(fixture.directory, `server-${mode}.log`)
  );
  const client = createClient(mode);
  let transport: StreamableHTTPClientTransport | undefined;
  try {
    const ready = await running.waitForOutput(
      /(?:E2E_READY |MCP Server running on )(http:\/\/127\.0\.0\.1:\d+\/mcp)/
    );
    const url = ready[1];
    transport = new StreamableHTTPClientTransport(new URL(url), {
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
      url,
      capabilities: new Set([
        ...BASE_CAPABILITIES.filter(
          (capability) => mode !== "legacy" || capability !== "input-required"
        ),
        "stateless-http",
      ]),
      unsupportedReasons:
        mode === "legacy"
          ? {
              "input-required":
                "Stateless legacy HTTP cannot receive server-to-client input requests",
            }
          : {},
      async close() {
        try {
          await client.close();
        } finally {
          await running.stop();
        }
      },
    };
  } catch (error) {
    await transport?.close().catch(() => {});
    await running.stop();
    throw new Error(
      `Cannot start ${fixture.label}/${mode}: ${String(error)}\n${running.output()}`,
      { cause: error }
    );
  }
}
