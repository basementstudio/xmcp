import type { StdioServerParameters } from "@modelcontextprotocol/client/stdio";
import type { Fixture } from "./fixture.js";
import { startHttpServer } from "./targets/http.js";
import { getStdioLaunch } from "./targets/stdio.js";

export type ClientTarget =
  | { type: "http"; url: string; close(): Promise<void> }
  | {
      type: "stdio";
      parameters: StdioServerParameters;
      onStderrData(chunk: Buffer): void;
    };

/** Prepare a fixture for a client under test, without connecting a harness client. */
export async function prepareClientTarget(
  fixture: Fixture
): Promise<ClientTarget> {
  if (fixture.spec.kind === "stdio") {
    // The client must own the spawned server's stdin/stdout and its teardown.
    return { type: "stdio", ...getStdioLaunch(fixture, "client") };
  }
  const server = await startHttpServer(fixture, "client");
  return { type: "http", url: server.url, close: server.close };
}
